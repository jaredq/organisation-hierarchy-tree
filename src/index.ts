import csv from 'csv-parser';
import * as fastcsv from 'fast-csv';
import fs from 'fs';

interface Employee {
  name: string;
  id: string;
  managerId: string;
  manager: Employee;
  managementLevel: number;
  subordinates: Employee[];
}

const employeeData: Employee[] = [];

const treeData: string[][] = [];

let maxLevel = 0;

function updateMaxLevel(managementLevel: number): void {
  if (managementLevel > maxLevel) {
    maxLevel = managementLevel;
  }
}

function generateHeaders(maxLevel: number): string[] {
  const headers: string[] = [];
  let headerSize = maxLevel;
  while (headerSize--) headers.push(String(maxLevel - headerSize));
  return headers;
}

function findEmployee(id: string): Employee | undefined {
  return employeeData.find(e => e.id === id);
}

function findSubordinates(managerId: string): Employee[] {
  return employeeData.filter(e => e.managerId === managerId);
}

function updateSubordinates(employee: Employee): void {
  employee.subordinates.forEach(subordinate => {
    subordinate.manager = employee;
    subordinate.managementLevel = employee.managementLevel + 1;
    updateMaxLevel(subordinate.managementLevel);

    updateSubordinates(subordinate);
  });
}

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
    employeeData.push(employee);

    if (employee.managerId) {
      const manager: Employee | undefined = findEmployee(employee.managerId);
      if (manager) {
        // console.log(employee.name, manager.name);
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

    employee.subordinates = findSubordinates(employee.id);
    updateSubordinates(employee);
  })
  .on('end', () => {
    const headers: string[] = generateHeaders(maxLevel + 1);

    treeData.push(headers);

    employeeData
      .filter(e => !e.manager)
      .forEach(root => {
        addEmployeeToTree(root);
      });

    const ws = fs.createWriteStream(__dirname + '/tree.csv');
    fastcsv.write(treeData, { headers: true }).pipe(ws);
  });
