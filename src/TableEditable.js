import React, { useState } from "react";
import { Column, ColumnHeaderCell, EditableCell, Table, Cell } from "@blueprintjs/table";
import '../node_modules/@blueprintjs/table/lib/css/table.css'
import '../node_modules/@blueprintjs/core/lib/css/blueprint.css'
import UserDataService from "./services/UserService";
import EmployeeDataService from "./services/EmployeeService";
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { withStyles } from '@material-ui/styles';
import FormHelperText from '@material-ui/core/FormHelperText';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'
const styles = theme => ({
    select: {
        border: "1px solid grey",
        borderRadius: "5%",
        padding: 5
    },
    formhelper: {
        fontSize: 20
    },
    signout: {
        width: '50%'
    }
});


class TableEditable extends React.Component {
    static dataKey = (rowIndex, columnIndex) => {
        return `${rowIndex}-${columnIndex}`;
    };

    constructor(props) {
        super(props);
        this.state = {
            columnNames: ["ID", "Name", "Gender", "Age", "Address", "Size"],
            sparseCellData: {},
            sparseColumnIntents: [],
            users: null,
            currentUser: null,
            rowEdited: null,
            selectedTable: 'Users'
        };
        this.retrieveData();
    }


    /**
    * Populates cell with data through cooardinates
    * @param idX x-axis cell cooardinate
    * @param idY y-axis cell cooardinate
    * @param data data to display in cell
    * @param cellData object holding all cell data
    */
    populateCell = (idX, idY, data, cellData) => {
        return cellData[idX + '-' + idY] = data;
    }


    /**
    * Retrieving data depending on selected table (Employee or User)
    */
    retrieveData = () => {
        const cellData = {};
        const data = this.state.selectedTable == "Employees" ? EmployeeDataService.getAll() : UserDataService.getAll();
        data.then(response => {
            this.setState({ users: response.data })
            response.data.forEach((user, index) => {
                this.populateCell(index, 0, user.id, cellData);
                this.populateCell(index, 1, user.name, cellData);
                this.populateCell(index, 2, user.gender, cellData);
                this.populateCell(index, 3, user.age, cellData);
                this.populateCell(index, 4, user.address, cellData);
                this.populateCell(index, 5, user.size, cellData);
            })
            this.setState({ sparseCellData: cellData });
            this.setState({ rowEdited: null });
        }).catch(e => { console.log(e) });
    };

    /**
    * Update data depending on selected table (Employee or User)
    */
    updateData = () => {
        const data = this.state.selectedTable == "Employees" ? EmployeeDataService.update(this.state.currentUser.id, this.state.currentUser) : UserDataService.update(this.state.currentUser.id, this.state.currentUser);
        data.then(response => {
            console.log("Updated successfully!");
            this.retrieveData();
        }).catch(e => { console.log(e) });
    };

    /**
    * Add data depending on selected table (Employee or User)
    */
    addData = () => {
        const data = this.state.selectedTable == "Employees" ? EmployeeDataService.create(this.state.currentUser) : UserDataService.create(this.state.currentUser);
        data.then(response => {
            console.log("Added successfully!");
            this.retrieveData();
        }).catch(e => { console.log(e) });
    };

    /**
    * Delete data depending on selected table (Employee or User)
    */
    deleteData = () => {
        const data = this.state.selectedTable == "Employees" ? EmployeeDataService.delete(this.state.currentUser.id) : UserDataService.delete(this.state.currentUser.id);
        data.then(response => {
            console.log("Deleted successfully!");
            this.retrieveData();
        }).catch(e => { console.log(e) });
    };

    /**
    * Handle on selection of table
    */
    handleTableChange = (event) => {
        this.setState({ selectedTable: event.target.value }, this.retrieveData);
    }

    /**
    * Checks whether row is loading (shimmered) or not
    */
    isLoadingRow = (rowIndex, columnIndex) => {
        return rowIndex == this.state.rowEdited || this.state.users == null;
    }

    /**
    * Renders table cell
    * @param rowIndex index of row
    * @param columnIndex index of column
    */
    renderCell = (rowIndex, columnIndex) => {
        const dataKey = TableEditable.dataKey(rowIndex, columnIndex);
        const value = this.state.sparseCellData ? this.state.sparseCellData[dataKey] : null;
        return (
            // If first column, render non editable cell for ID, else editable cell
            columnIndex != 0 ?
                <EditableCell
                    value={value == null ? "" : value}
                    intent={this.state.sparseCellIntent ? this.state.sparseCellIntent[dataKey] : 'none'}
                    onCancel={this.cellValidator(rowIndex, columnIndex)}
                    onChange={this.cellValidator(rowIndex, columnIndex)}
                    onConfirm={this.cellSetter(rowIndex, columnIndex)}
                    loading={this.isLoadingRow(rowIndex, columnIndex)}
                />
                :
                <Cell loading={this.isLoadingRow(rowIndex, columnIndex)}> {value} </Cell>
        );
    };

    /**
    * Renders Column header
    * @param columnIndex index of column
    */
    renderColumnHeader = (columnIndex) => {
        return <ColumnHeaderCell name={this.state.columnNames[columnIndex]} />;
    };

    /**
    * Validates cell
    * @param rowIndex index of row
    * @param columnIndex index of column
    */
    cellValidator = (rowIndex, columnIndex) => {
        const dataKey = TableEditable.dataKey(rowIndex, columnIndex);
        return (value) => {
            this.setSparseState("sparseCellData", dataKey, value);
        };
    };

    /**
    * Sets data in cell
    * @param rowIndex index of row
    * @param columnIndex index of column
    */
    cellSetter = (rowIndex, columnIndex) => {
        const dataKey = TableEditable.dataKey(rowIndex, columnIndex);
        return (value) => {
            // Get values from cells
            const id = this.state.sparseCellData[rowIndex + '-0'];
            const name = this.state.sparseCellData[rowIndex + '-1'];
            const gender = this.state.sparseCellData[rowIndex + '-2'];
            const age = this.state.sparseCellData[rowIndex + '-3'];
            const address = this.state.sparseCellData[rowIndex + '-4'];
            const size = this.state.sparseCellData[rowIndex + '-5'];

            const user = {};

            // Set user object with cell values
            user['id'] = id;
            user['name'] = name;
            user['gender'] = gender;
            user['age'] = age;
            user['address'] = address;
            user['size'] = size;

            if (!this.isEmptyOrNull(value)) {
                // if ID exists, update using data, else add 
                this.setSparseState("sparseCellData", dataKey, value)
                this.setState({ currentUser: user }, id != null ? this.updateData : this.addData);
                this.setState({ rowEdited: id != null ? rowIndex : null });
            } else {
                // Delete if rows data is empty, else update
                const isRowEmpty = this.isEmptyOrNull(name) && this.isEmptyOrNull(gender) && this.isEmptyOrNull(age) && this.isEmptyOrNull(address) && this.isEmptyOrNull(size);
                this.setState({ currentUser: user }, isRowEmpty ? this.deleteData : id != null ? this.updateData : null);

            }
        };
    };

    /**
    * Checks if value is empty or null
    * @param value index of row
    */
    isEmptyOrNull(value) {
        return !value || value == '';
    }

    /**
    * Setter for sparse state
    * @param stateKey state key
    * @param dataKey data key
    * @param value value to set
    */
    setSparseState(stateKey, dataKey, value) {
        const stateData = (this.state)[stateKey];
        const values = { ...stateData, [dataKey]: value };
        this.setState({ [stateKey]: values });
    }

    render() {
        const { classes } = this.props;
        const columns = this.state.columnNames ? this.state.columnNames.map((_, index) => {
            return (
                <Column key={index} cellRenderer={this.renderCell} columnHeaderCellRenderer={this.renderColumnHeader} />
            );
        }) : <div />;
        return (
            <div>
                <div style={{ margin: '20px' }}>
                    <FormHelperText className={classes.formhelper}>Select table</FormHelperText>
                    <Select
                        className={classes.select}
                        style={{ fontsSize: '50px!important' }}
                        value={this.state.selectedTable}
                        onChange={this.handleTableChange}
                    >
                        <MenuItem value={'Users'}>Users</MenuItem>
                        <MenuItem value={'Employees'}>Employees</MenuItem>
                    </Select>
                    <div style={{width: '10%', display:'inline-block', float:'right'}}>
                        <AmplifySignOut />
                    </div>
                </div>
                <Table numRows={50}>{columns}</Table>
            </div>
        );
    }
}
export default withStyles(styles)(TableEditable);