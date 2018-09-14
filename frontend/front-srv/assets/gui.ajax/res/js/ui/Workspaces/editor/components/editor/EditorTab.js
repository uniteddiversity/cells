/*
 * Copyright 2007-2017 Charles du Jeu - Abstrium SAS <team (at) pyd.io>
 * This file is part of Pydio.
 *
 * Pydio is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Pydio is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Pydio.  If not, see <http://www.gnu.org/licenses/>.
 *
 * The latest code can be found at <https://pydio.com>.
 */

import Pydio from 'pydio'
import { Toolbar, ToolbarGroup, Card, CardHeader, CardMedia, DropDownMenu, MenuItem, Slider, IconButton } from 'material-ui';
import { connect } from 'react-redux';
import panAndZoomHoc from 'react-pan-and-zoom-hoc';
import { compose, bindActionCreators } from 'redux';
import makeMaximise from './make-maximise';

const { EditorActions, ResolutionActions, ContentActions, SizeActions, SelectionActions, LocalisationActions, withMenu, withSizeControls } = Pydio.requireLib('hoc');

const styles = {
    iconButton: {
        backgroundColor: "rgb(0, 0, 0, 0.87)",
        color: "rgb(255, 255,255, 0.87)"
    }
}

@panAndZoomHoc
class Test extends React.Component {
    render() {
        return <div>HERE</div>
    }
}


@connect(mapStateToProps, EditorActions)
export default class Tab extends React.Component {
    static get styles() {
        return {
            container: {
                display: "flex",
                flex: 1,
                flexFlow: "column nowrap",
                overflow: "auto",
                backgroundColor: "rgb(66, 66, 66)"
            },
            child: {
                display: "flex",
                flex: 1
            },
            toolbar: {
                backgroundColor: "#000000",
                opacity: 0.8,
                width: "min-content",
                margin: "0 auto",
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
            }
        }
    }

    renderControls(Controls, Actions) {
        const {node, editorData} = this.props
        const {SelectionControls, ResolutionControls, SizeControls, ContentControls, ContentSearchControls, LocalisationControls} = Controls

        let actions = {
            ...SizeActions,
            ...SelectionActions,
            ...ResolutionActions,
            ...ContentActions,
            ...LocalisationActions
        }

        if (editorData.editorActions) {
            actions = {
                ...actions,
                ...Actions
            }
        }

        let boundActionCreators = bindActionCreators(actions)

        const controls = (Controls) => {
            return Object.keys(Controls)
                .filter((key) => typeof Controls[key] === 'function')
                .map((key) => {
                    const Control = Controls[key]
                    return <Control editorData={editorData} node={node} {...boundActionCreators} />
                })
        }

        // {ResolutionControls && <ToolbarGroup>{controls(ResolutionControls)}</ToolbarGroup>}
        // {SelectionControls && <ToolbarGroup>{controls(SelectionControls)}</ToolbarGroup>}
        return (
            <SnackBar style={Tab.styles.toolbar}>
                {SizeControls && <ToolbarGroup>{controls(SizeControls)}</ToolbarGroup>}
                {ContentControls && <ToolbarGroup>{controls(ContentControls)}</ToolbarGroup>}
                {ContentSearchControls && <ToolbarGroup>{controls(ContentSearchControls)}</ToolbarGroup>}
                {LocalisationControls && <ToolbarGroup>{controls(LocalisationControls)}</ToolbarGroup>}
            </SnackBar>
        )
    }

    render() {
        const {node, editorData, Editor, Controls, Actions, id, isActive, editorSetActiveTab, style} = this.props

        const select = () => editorSetActiveTab(id)

        return !isActive ? (
            <AnimatedCard style={style} containerStyle={Tab.styles.container} maximised={isActive} expanded={isActive} onExpandChange={!isActive ? select : null}>
                <CardHeader title={id} actAsExpander={true} showExpandableButton={true} />
                <CardMedia style={Tab.styles.child} mediaStyle={Tab.styles.child}>
                    <Editor pydio={pydio} node={node} editorData={editorData} />
                </CardMedia>
            </AnimatedCard>
        ) : (
            <AnimatedCard style={style} containerStyle={Tab.styles.container} maximised={true} expanded={isActive} onExpandChange={!isActive ? select : null}>
                <Editor pydio={pydio} node={node} editorData={editorData} />
                <Test />
                {Controls && this.renderControls(Controls, Actions)}
            </AnimatedCard>
        )
    }
}

@withSizeControls
class SnackBar extends React.Component {
    constructor(props) {
        super(props)

        const {size, scale} = props

        this.state = {
            minusDisabled: scale - 0.5 <= 0,
            magnifyDisabled: size == "contain",
            plusDisabled: scale + 0.5 >= 20,
        }
    }

    componentWillReceiveProps(props) {
        const {size, scale} = props

        this.setState({
            minusDisabled: scale - 0.5 <= 0,
            magnifyDisabled: size == "contain",
            plusDisabled: scale + 0.5 >= 20,
        })
    }

    render() {
        const {minusDisabled= false, magnifyDisabled = false, plusDisabled = false} = this.state
        const {size, scale, onSizeChange, ...remaining} = this.props
        return (
            <Toolbar {...remaining}>
                {onSizeChange && (
                    <ToolbarGroup>
                        <IconButton
                            iconClassName="mdi mdi-minus"
                            iconStyle={styles.iconButton}
                            onClick={() => onSizeChange({
                                size: "auto",
                                scale: scale - 0.5
                            })}
                            disabled={minusDisabled}
                        />
                        <IconButton
                            iconClassName="mdi mdi-magnify-minus"
                            iconStyle={styles.iconButton}
                            onClick={() => onSizeChange({
                                size: "contain",
                            })}
                            disabled={magnifyDisabled}
                        />
                        <IconButton
                            iconClassName="mdi mdi-plus"
                            iconStyle={styles.iconButton}
                            onClick={() => onSizeChange({
                                size: "auto",
                                scale: scale + 0.5
                            })}
                            disabled={plusDisabled}
                        />
                    </ToolbarGroup>
                )}
            </Toolbar>
        )
    }
}

function mapStateToProps(state, ownProps) {
    const { editor, tabs } = state

    let current = tabs.filter(tab => tab.id === ownProps.id)[0]

    return  {
        ...ownProps,
        ...current,
        isActive: editor.activeTabId === current.id
    }
}

const AnimatedCard = makeMaximise(Card)
