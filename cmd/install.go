/*
 * Copyright (c) 2018. Abstrium SAS <team (at) pydio.com>
 * This file is part of Pydio Cells.
 *
 * Pydio Cells is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Pydio Cells is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Pydio Cells.  If not, see <http://www.gnu.org/licenses/>.
 *
 * The latest code can be found at <https://pydio.com>.
 */

package cmd

import (
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"github.com/manifoldco/promptui"
	"github.com/mholt/caddy"
	_ "github.com/mholt/caddy/caddyhttp"
	"github.com/mholt/caddy/caddytls"
	"github.com/micro/go-web"
	"github.com/spf13/cobra"

	"github.com/pydio/cells/common"
	"github.com/pydio/cells/common/config"
	"github.com/pydio/cells/common/log"
	"github.com/pydio/cells/common/registry"
	"github.com/pydio/cells/common/service"
	"github.com/pydio/cells/common/service/defaults"
	"github.com/pydio/cells/common/utils"
	"github.com/pydio/cells/discovery/install/assets"
)

const (
	caddyfile = `
		 {{.URL}} {
			 root "{{.Root}}"
			 proxy /install localhost:{{.Micro}}
			 {{.TLS}}
		 }
	 `
)

var (
	niBindUrl        string
	niExtUrl         string
	niDisableSsl     bool
	niLeEmailContact string
	niLeAcceptEula   bool
)

// installCmd represents the install command
var installCmd = &cobra.Command{
	Use:   "install",
	Short: "Pydio Cells Installer",
	Long: `This command launch the installation process of Pydio Cells.

 It will ask for the Bind Host to hook the webserver on a network interface IP, and you can set different hosts for accessing
 the machine from outside world (if it is behind a proxy or inside a container with ports mapping for example).
 You can launch this installer in non-interactive mode by providing --bind and --external. This will launch the browser-based
 installer with SSL active using self_signed setup by default.
 You might also use Let's Encrypt automatic certificate generation by providing a contact email and accepting Let's Encrypt EULA, for instance:
 $ ` + os.Args[0] + ` install --bind share.mydomain.tld:443 --external share.mydomain.tld --le_email admin@mydomain.tld --le_agree true

 For example
 - Bind Host : 0.0.0.0:8080
 - External Host : share.mydomain.tld
 Or
 - Bind Host : share.mydomain.tld
 - External Host : share.mydomain.tld
 Or
 - Bind Host : IP:1515       # internal port
 - External Host : IP:8080   # external port mapped by docker
 Or
 - Bind Host : IP:8080
 - External Host : IP:8080

 It will open a browser to gather necessary information and configuration for Pydio Cells. if you don't have a browser access,
 you can launch the command line installation using the install-cli command:

 $ ` + os.Args[0] + ` install-cli

 Services will all start automatically after the install process is finished.
	 `,
	Run: func(cmd *cobra.Command, args []string) {

		cmd.Println("")
		cmd.Println("\033[1mWelcome to " + common.PackageLabel + " installation\033[0m")
		cmd.Println(common.PackageLabel + " will be configured to run on this machine. Make sure to prepare the following data")
		cmd.Println(" - IPs and ports for binding the webserver to outside world")
		cmd.Println(" - MySQL 5.6+ (or MariaDB equivalent) server access")
		cmd.Println("Pick your installation mode when you are ready.")
		cmd.Println("")

		var internal, external *url.URL

		if niBindUrl != "" && niExtUrl != "" {

			var saveMsg, prefix string

			if niDisableSsl {
				prefix = "http://"
				saveMsg = "Install / Non-Interactive / Without SSL"
			} else {

				saveMsg = "Install / Non-Interactive / "
				prefix = "https://"
				config.Set(true, "cert", "proxy", "ssl")

				if niLeEmailContact != "" {

					// TODO add an option to provide specific CA URL
					if !niLeAcceptEula {
						cmd.Print("fatal: you must accept Let's Encrypt EULA by setting the corresponding flag in order to use this mode")
						os.Exit(1)
					}

					saveMsg += "With Let's Encrypt automatic cert generation"
					config.Set(false, "cert", "proxy", "self")
					config.Set(niLeEmailContact, "cert", "proxy", "email")
					config.Set(config.DefaultCaUrl, "cert", "proxy", "caUrl")

				} else {
					config.Set(true, "cert", "proxy", "self")
					saveMsg += "With self signed certificate"
				}
			}

			internal, _ = url.Parse(prefix + niBindUrl)
			config.Set(internal.String(), "defaults", "urlInternal")

			external, _ = url.Parse(prefix + niExtUrl)
			config.Set(external.String(), "defaults", "url")

			config.Save("cli", saveMsg)

		} else {

			p := promptui.Select{Label: "Installation mode", Items: []string{"Browser-based (requires a browser access)", "Command line (performed in this terminal)"}}
			if i, _, e := p.Run(); e != nil {
				cmd.Help()
				log.Fatal(e.Error())
				os.Exit(1)
			} else {
				if i == 0 {
					var err error
					internal, external, err = promptAndSaveInstallUrls()
					if err != nil {
						cmd.Help()
						log.Fatal(err.Error())
					}
					cmd.Printf("About to launch browser install, install URLs:\ninternal: %s\nexternal: %s\n", internal, external)

				} else {
					// Launch install cli then
					installCliCmd.Run(cmd, args)
					return
				}
			}

		}

		// Installing the JS data
		dir, err := assets.GetAssets("../discovery/install/assets/src")
		if err != nil {
			dir := filepath.Join(config.ApplicationDataDir(), "static", "install")

			if err, _, _ := assets.RestoreAssets(dir, assets.PydioInstallBox, nil); err != nil {
				cmd.Println("Could not restore install package", err)
				os.Exit(0)
			}
		}

		// Getting the micro api port
		micro := config.Get("ports", common.SERVICE_MICRO_API).Int(0)
		if micro == 0 {
			micro = utils.GetAvailablePort()
			config.Set(micro, "ports", common.SERVICE_MICRO_API)
		}

		config.Save("cli", "Install / Setting default Port")

		// Manage TLS settings
		var tls string
		if config.Get("cert", "proxy", "ssl").Bool(false) {
			if config.Get("cert", "proxy", "self").Bool(false) {
				tls = "tls self_signed"
			} else if config.Get("cert", "proxy", "email").String("") != "" {
				tls = fmt.Sprintf("tls %s", config.Get("cert", "proxy", "email").String(""))
				caddytls.Agreed = true
				caddytls.DefaultCAUrl = config.Get("cert", "proxy", "caUrl").String("")
				// useStagingCA := config.Get("cert", "proxy", "useStagingCA").Bool(false)
			} else {
				cert := config.Get("cert", "proxy", "certFile").String("")
				key := config.Get("cert", "proxy", "keyFile").String("")
				if cert != "" && key != "" {
					tls = fmt.Sprintf("tls %s %s", cert, key)
				}
			}
		}

		// Creating temporary caddy file
		if err := config.InitCaddyFile(caddyfile, struct {
			URL   *url.URL
			Root  string
			Micro int
			TLS   string
		}{
			URL:   internal,
			Root:  dir,
			Micro: micro,
			TLS:   tls,
		}); err != nil {
			log.Fatal(err.Error())
			os.Exit(0)
		}

		// starting the registry service
		for _, s := range registry.Default.GetServicesByName(defaults.Registry().String()) {
			s.Start()
		}

		// starting the micro service
		for _, s := range registry.Default.GetServicesByName(common.SERVICE_MICRO_API) {
			s.Start()
		}

		installFinished := make(chan bool, 1)
		// starting the installation REST service
		for _, s := range registry.Default.GetServicesByName(common.SERVICE_INSTALL) {
			sServ := s.(service.Service)
			sServ.Options().Web.Init(web.AfterStop(func() error {
				installFinished <- true
				return nil
			}))
			s.Start()
		}

		config.Save("cli", "Install / Saving final configs")

		// load caddyfile
		caddyfile, err := caddy.LoadCaddyfile("http")
		if err != nil {
			cmd.Print(err)
			os.Exit(1)
		}

		// start caddy server
		instance, err := caddy.Start(caddyfile)
		if err != nil {
			cmd.Print(err)
			os.Exit(1)
		}

		open(external.String())

		go func() {
			// Waiting on caddy
			instance.Wait()
		}()

		<-installFinished
		instance.ShutdownCallbacks()
		instance.Stop()

		// Re-building allServices list
		initServices()
		if s, err := registry.Default.ListServices(); err != nil {
			cmd.Print("Could not retrieve list of services")
			os.Exit(0)
		} else {
			allServices = s
		}

		// Start all services
		excludes := []string{
			"nats",
			common.SERVICE_MICRO_API,
			common.SERVICE_REST_NAMESPACE_ + common.SERVICE_INSTALL,
		}
		for _, service := range allServices {
			ignore := false
			for _, ex := range excludes {
				if service.Name() == ex {
					ignore = true
				}
			}
			if service.Regexp() != nil {
				ignore = true
			}
			if !ignore {
				go service.Start()
			}
		}

		wg.Add(1)
		wg.Wait()

	},
}

// open opens the specified URL in the default browser of the user.
func open(url string) error {
	var cmd string
	var args []string
	fmt.Println("Opening URL " + url + " in your browser. Please copy/paste it if the browser is not on the same machine.")
	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "open"
	default: // "linux", "freebsd", "openbsd", "netbsd"
		cmd = "xdg-open"
	}
	args = append(args, url)
	return exec.Command(cmd, args...).Start()
}

func init() {

	flags := installCmd.PersistentFlags()
	flags.StringVar(&niBindUrl, "bind", "", "[Non interactive mode] internal URL:PORT on which the main proxy will bind. Self-signed SSL will be used by default")
	flags.StringVar(&niExtUrl, "external", "", "[Non interactive mode] external URL:PORT exposed to outside")
	flags.BoolVar(&niDisableSsl, "no_ssl", false, "[Non interactive mode] do not enable self signed automatically")
	flags.StringVar(&niLeEmailContact, "le_email", "", "[Non interactive mode] contact e-mail for Let's Encrypt provided certificate")
	flags.BoolVar(&niLeAcceptEula, "le_agree", false, "[Non interactive mode] accept Let's Encrypt EULA")

	RootCmd.AddCommand(installCmd)
}
