/**
 * @fileOverview ssjs utilities
 * @author Welsh Harris
 * @created 06/18/2011

 * @copyright (c) 2011 - 2013 CoreBits DataWorks LLC
 * @license Released under the MIT license (included in distribution in MIT LICENSE.txt)
 * @source https://github.com/swelshh/Wakanda-Tab-Delim-Import
 */


/**
 * Import tab delimited text file data into a datastore class.
 * @param {String} dsClassName Name of the datastore class we are importing data into.
 * @param {String} fileName File name stored in project/import.
 * @param {Bool} hdrRow If the file to import has a header row.
 * @param {String[]} attributeNames Attribute names corresponding to import file columns.
 * @return {String} Summary of the import.
 * @example
 * utl.importTabDelim('Person', 'PersonImport.txt', true, ['ID', 'firstName', 'lastName']);
 */
exports.importTabDelim = function(dsClassName, fileName, hdrRow, attributeNames) {
	var i, filePath, importRow, importStream, highestID;
	var importingID // bool indicating if we are importing into the ID field
	var posID // position of the ID element in the attributeNames array if there is one
	var row // string to hold data for one row of the import file
	var cells // array with an element for each cell of a row
	var newEntity // reference to newly created entities
	var numEntitiesImported // count how many records we import
	var importSmmry // string summarizing the import
	
	// get the file path
	filePath = ds.getModelFolder().path + "import/" + fileName;
	
	// determine if we are importing ID
	importingID = false
	posID = attributeNames.indexOf('ID'); // get the position of our ID field. 
	if(posID > -1) {
		importingID = true;
	};
	
	// open a text stream to the import file
	importStream = TextStream(filePath, 'read');
	
	//skip the header
	if(hdrRow) {
		row = importStream.read('');
	};

	//loop over each row
	numEntitiesImported = 0;
	while (!importStream.end()) { 
		
		row = importStream.read(''); //get this row
		cells = row.split('\t'); //split into array with an element for each column cell
		if (cells.length  >= attributeNames.length) { //if the array has an element for each attribute
			
			// make sure the record doesn't already exist if we are importing ID's
			importRow = true;
			if(importingID) {
				importRow = (ds[dsClassName].find('ID = ' + cells[posID]) === null) 
			};
			
			// build new entity
			if(importRow) {
				newEntity = ds[dsClassName].createEntity(); //create the new entity
				for(i = 0; i < attributeNames.length; i += 1) { //set each entity field
					if (ds[dsClassName][attributeNames[i]].type === 'date') {
						newEntity[attributeNames[i]] = new Date(cells[i]);
					} else {
						newEntity[attributeNames[i]] = cells[i];
					}; //end if
				}; //end for
				newEntity.save(); //save the entity
				numEntitiesImported = numEntitiesImported + 1;
			}; //end if
			
		}; //end if
	}; //end while
	importStream.close(); // close the file
	
	// reset id sequence number if we imported id values
	if(importingID) {
		highestID = ds[dsClassName].orderBy('ID desc').first().ID;
		ds[dsClassName].setAutoSequenceNumber(highestID + 1)
	};
	
	// return summary of the import
	importSmmry = {
		dataClass: ds[dsClassName].getName(),
		imported: numEntitiesImported,
		toString: function toString() {
			return this.count + ' records imported into the ' + this.dataClass + ' datastore class.';
		}
	};
	return importSmmry;
};
