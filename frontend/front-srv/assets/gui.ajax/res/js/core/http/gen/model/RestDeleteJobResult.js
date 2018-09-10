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





/**
* The RestDeleteJobResult model module.
* @module model/RestDeleteJobResult
* @version 1.0
*/
export default class RestDeleteJobResult {
    /**
    * Constructs a new <code>RestDeleteJobResult</code>.
    * @alias module:model/RestDeleteJobResult
    * @class
    */

    constructor() {
        

        
        

        

        
    }

    /**
    * Constructs a <code>RestDeleteJobResult</code> from a plain JavaScript object, optionally creating a new instance.
    * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
    * @param {Object} data The plain JavaScript object bearing properties of interest.
    * @param {module:model/RestDeleteJobResult} obj Optional instance to populate.
    * @return {module:model/RestDeleteJobResult} The populated <code>RestDeleteJobResult</code> instance.
    */
    static constructFromObject(data, obj) {
        if (data) {
            obj = obj || new RestDeleteJobResult();

            
            
            

            if (data.hasOwnProperty('Uuid')) {
                obj['Uuid'] = ApiClient.convertToType(data['Uuid'], 'String');
            }
            if (data.hasOwnProperty('Label')) {
                obj['Label'] = ApiClient.convertToType(data['Label'], 'String');
            }
        }
        return obj;
    }

    /**
    * @member {String} Uuid
    */
    Uuid = undefined;
    /**
    * @member {String} Label
    */
    Label = undefined;








}


