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
import React from 'react'
import PydioApi from 'pydio/http/api'
import Node from 'pydio/model/node'
import {TextField} from 'material-ui'
import {RoleServiceApi, IdmRole} from 'pydio/http/rest-api';
import uuid from 'uuid4'

const CreateRoleOrGroupForm = React.createClass({

    mixins:[
        AdminComponents.MessagesConsumerMixin,
        PydioReactUI.CancelButtonProviderMixin,
        PydioReactUI.SubmitButtonProviderMixin
    ],

    propTypes:{
        type: React.PropTypes.oneOf(['group', 'user', 'role']),
        roleNode: React.PropTypes.instanceOf(Node),
        openRoleEditor: React.PropTypes.func
    },

    getTitle(){
        if(this.props.type === 'group'){
            return this.context.getMessage('ajxp_admin.user.15');
        }else{
            return this.context.getMessage('ajxp_admin.user.14');
        }
    },

    getPadding(){
        return true;
    },

    getSize() {
        return 'sm'
    },

    dismiss() {
        return this.props.onDismiss();
    },

    submit() {
        const {type, pydio, reload} = this.props;
        let parameters;
        let currentNode;
        if( type === "group"){
            const gId = this.refs.group_id.getValue();
            const gLabel = this.refs.group_label.getValue();
            if(!gId || !gLabel){
                return;
            }
            if(pydio.getContextHolder().getSelectedNodes().length){
                currentNode = pydio.getContextHolder().getSelectedNodes()[0];
            }else{
                currentNode = pydio.getContextNode();
            }
            const currentPath = currentNode.getPath().replace('/idm/users', '');
            PydioApi.getRestClient().getIdmApi().createGroup(currentPath || '/', gId, gLabel).then(() => {
                this.dismiss();
                currentNode.reload();
            });

        }else if (type === "role"){
            const api = new RoleServiceApi(PydioApi.getRestClient());
            const idmRole = new IdmRole();
            idmRole.Uuid = uuid.sync();
            idmRole.Label = this.refs.role_id.getValue();
            currentNode = this.props.roleNode;
            api.setRole(idmRole.Uuid, idmRole).then(()=>{
                this.dismiss();
                if(reload) {
                    reload();
                }
            })
        }

    },

    render(){
        if(this.props.type === 'group'){
            return (
                <div style={{width:'100%'}}>
                    <TextField
                        ref="group_id"
                        fullWidth={true}
                        floatingLabelText={this.context.getMessage('ajxp_admin.user.16')}
                    />
                    <TextField
                        ref="group_label"
                        fullWidth={true}
                        floatingLabelText={this.context.getMessage('ajxp_admin.user.17')}
                    />
                </div>
            );
        }else{
            return (
                <div style={{width:'100%'}}>
                    <TextField
                        ref="role_id"
                        floatingLabelText={this.context.getMessage('ajxp_admin.user.18')}
                    />
                </div>
            );
        }
    }

});

export {CreateRoleOrGroupForm as default}