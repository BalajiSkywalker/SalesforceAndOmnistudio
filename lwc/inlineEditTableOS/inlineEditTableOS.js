import { LightningElement,api,track } from 'lwc';
import {OmniscriptBaseMixin} from "omnistudio/omniscriptBaseMixin"

export default class InlineEditTableOS extends OmniscriptBaseMixin(LightningElement) {


   
    @api columnJson;
    @api initialData;
    @track column_data;
     @track recordsToDisplay;
     @track selectedIds =[];
     @track displayedRecords = []; // Records for the current page   
    @track currentPage = 1;
    @track pageSize = 10; // Number of records per page
    totalPages = 0;
    @track masterSelected=[];

     @track editedRows = {}; // Track rows edited by the user (id-based mapping)



    connectedCallback() {
        console.log('Inside connectedcallback');
        if(this.columnJson){
            this.column_data =this.parseJson(this.columnJson);
        }
        if(this.initialData){
            this.recordsToDisplay =this.parseJson(this.initialData);
             this.totalPages = Math.ceil(this.recordsToDisplay.length / this.pageSize);
        this.updateDisplayedRecords();
        }
        

        
       
    }
    parseJson(input) {
    let parsedData;

    // Check if the input is already a JSON object
    if (typeof input === 'object') {
        parsedData = input; // If it's already an object, no need to parse
    } else if (typeof input === 'string') {
        try {
            parsedData = JSON.parse(input); // Try parsing the string
        } catch (error) {
            console.error('Invalid JSON string:', error);
            throw new Error('Invalid JSON format');
        }
    } else {
        console.error('Input is neither a string nor a valid JSON object.');
        throw new Error('Unsupported input format');
    }

    return parsedData;
}

    handleCellChange(event) {
        const { draftValues } = event.detail; // Edited values in lightning-datatable
        draftValues.forEach((draft) => {
            this.editedRows[draft.Id] = { ...this.editedRows[draft.Id], ...draft };
        });
    }
     
    
     handleSave() {
        // Create an array of all edited rows
        const updatedData = Object.keys(this.editedRows).map((Id) => ({
            Id,
            ...this.editedRows[Id],
        }));

         this.displayedRecords = this.displayedRecords.map((row) => {
            if (this.editedRows[row.Id]) {
                return { ...row, ...this.editedRows[row.Id] }; // Merge edits into original row
            }
            return row;
        });

        // Clear the draft values and edited rows tracking
        this.template.querySelector('lightning-datatable').draftValues = [];
        this.editedRows = {};

        // Update OmniScript JSON with edited data and selected rows
        this.omniApplyCallResp({
            updatedTableData: updatedData,
            selectedRowIds: this.selectedRows,
        });

        // Clear edited rows tracking
        this.editedRows = {};
    }
     updateDisplayedRecords() {
        const startIdx = (this.currentPage - 1) * this.pageSize;
        const endIdx = startIdx + this.pageSize;

        this.displayedRecords = this.recordsToDisplay.slice(startIdx, endIdx);
        if(this.masterSelected.length>0){
            this.selectedIds = this.displayedRecords
                .map((record) => record.Id)
                .filter((id) => this.masterSelected.includes(id));

        }else{
             const savedIds = JSON.parse(sessionStorage.getItem('selectedRowIds') || '[]');
             if(savedIds.length >0){
                
                this.masterSelected[0]=savedIds[0].Id;
                 this.selectedIds = this.displayedRecords
                .map((record) => record.Id)
                .filter((id) => this.masterSelected.includes(id));


             }
             
        }
         
    }

    handleNext() {
        if (this.currentPage < this.totalPages) {
           

            this.currentPage++;
            this.updateDisplayedRecords();
        }
    }

    handlePrev() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateDisplayedRecords();
        }
    }

    handleSelectedMembers(event) {
       
        const selectedRows = JSON.parse(JSON.stringify(event.detail.selectedRows));
        if(selectedRows.length>0){

             this.masterSelected[0]=selectedRows[0].Id;
             //this.omniApplyCallResp({test:selectedRows[0]});
             sessionStorage.setItem('selectedRowIds', JSON.stringify(selectedRows));
            this.omniApplyCallResp({            
            selectedRowIds: selectedRows,
        });

        }
        
        
       
    }

    get isNextDisabled() {
        return this.currentPage >= this.totalPages;
    }

    get isPrevDisabled() {
        return this.currentPage <= 1;
    }
}
