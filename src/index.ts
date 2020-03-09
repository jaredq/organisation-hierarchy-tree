import csv from 'csv-parser';
import * as fastcsv from 'fast-csv';
import fs from 'fs';
import { fileURLToPath } from 'url';

interface Employee {
  name: string;
  id: string;
  managerId: string;
  manager: Employee;
  managementLevel: number;
  subordinates: Employee[];
}

// employee list mapping to input data
const employeeList: Employee[] = [];

// hierarchy tree data for output to csv
const treeData: string[][] = [];

// max level of hierarchy tree
let maxLevel = 0;

function updateMaxLevel(managementLevel: number): void {
  if (managementLevel > maxLevel) {
    maxLevel = managementLevel;
  }
}

function findEmployee(id: string): Employee | undefined {
  return employeeList.find(e => e.id === id);
}

function findSubordinates(managerId: string): Employee[] {
  return employeeList.filter(e => e.managerId === managerId);
}

/**
 * update its subordinates' manager object and management level
 * @param employee
 */
function updateSubordinates(employee: Employee): void {
  employee.subordinates.forEach(subordinate => {
    subordinate.manager = employee;
    subordinate.managementLevel = employee.managementLevel + 1;
    updateMaxLevel(subordinate.managementLevel);

    updateSubordinates(subordinate);
  });
}

/**
 * generate column headers for CSV file using management levels, e.g. `1,2,3`
 * @param maxLevel
 */
function generateHeaders(maxLevel: number): string[] {
  const headers: string[] = [];
  let headerIndex = 0;
  while (headerIndex++ < maxLevel) headers.push(String(headerIndex));
  return headers;
}

/**
 * add the employee data to the hierarchy tree,
 * put its name or ID:[id] in the column corresponding to the management level
 * @param employee
 */
function addEmployeeToTree(employee: Employee): void {
  if (employee.managerId && !employee.manager) {
    treeData.push([`ID:${employee.managerId}`]);
  }
  const row: Array<string> = new Array(maxLevel);
  row[employee.managementLevel] = employee.name || `ID:${employee.id}`;
  treeData.push(row);

  employee.subordinates.forEach(e => {
    addEmployeeToTree(e);
  });
}

fs.createReadStream(__dirname + '/table.csv')
  .pipe(csv())
  .on('data', row => {
    const employee: Employee = row;

    // id is required
    if (!employee.id) {
      return;
    }

    // find the first employee with the same Id is existing
    const employeeWithSameId = findEmployee(employee.id);

    employeeList.push(employee);

    if (employee.managerId) {
      // find the manager of this employee, and update its manager object and management level
      const manager: Employee | undefined = findEmployee(employee.managerId);
      if (manager) {
        employee.manager = manager;
        manager.subordinates.push(employee);
        employee.managementLevel = manager.managementLevel + 1;
      } else {
        employee.managementLevel = 1;
      }
    } else {
      employee.managementLevel = 0;
    }
    updateMaxLevel(employee.managementLevel);

    // if same-Id employee is already existing, its subordinates will not be put under this employee node
    // the subordinates is only put under the same-Id employee node that appears for the first time.
    if (!employeeWithSameId) {
      employee.subordinates = findSubordinates(employee.id);
      updateSubordinates(employee);
    } else {
      employee.subordinates = [];
    }
  })
  .on('end', () => {
    // the column headers are management levels
    const headers: string[] = generateHeaders(maxLevel + 1);
    treeData.push(headers);

    employeeList
      .filter(e => !e.manager)
      .forEach(root => {
        // start from the employees who doesn't have a manager
        addEmployeeToTree(root);
      });

    const ws = fs.createWriteStream(__dirname + '/tree.csv');
    fastcsv.write(treeData, { headers: true }).pipe(ws);
  });
