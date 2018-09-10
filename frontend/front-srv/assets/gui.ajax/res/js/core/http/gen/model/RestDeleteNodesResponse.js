/**
 * Pydio Cells Rest API
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: 1.0
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 *
 */


import ApiClient from '../ApiClient';
import RestDeleteJobResult from './RestDeleteJobResult';





/**
* The RestDeleteNodesResponse model module.
* @module model/RestDeleteNodesResponse
* @version 1.0
*/
export default class RestDeleteNodesResponse {
    /**
    * Constructs a new <code>RestDeleteNodesResponse</code>.
    * @alias module:model/RestDeleteNodesResponse
    * @class
    */

    constructor() {
        

        
        

        

        
    }

    /**
    * Constructs a <code>RestDeleteNodesResponse</code> from a plain JavaScript object, optionally creating a new instance.
    * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
    * @param {Object} data The plain JavaScript object bearing properties of interest.
    * @param {module:model/RestDeleteNodesResponse} obj Optional instance to populate.
    * @return {module:model/RestDeleteNodesResponse} The populated <code>RestDeleteNodesResponse</code> instance.
    */
    static constructFromObject(data, obj) {
        if (data) {
            obj = obj || new RestDeleteNodesResponse();

            
            
            

            if (data.hasOwnProperty('DeleteJobs')) {
                obj['DeleteJobs'] = ApiClient.convertToType(data['DeleteJobs'], [RestDeleteJobResult]);
            }
        }
        return obj;
    }

    /**
    * @member {Array.<module:model/RestDeleteJobResult>} DeleteJobs
    */
    DeleteJobs = undefined;








}


