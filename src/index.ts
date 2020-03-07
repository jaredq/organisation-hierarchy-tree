import csv from 'csv-parser';
import * as fastcsv from 'fast-csv';
import fs from 'fs';

interface Employee {
  name: string;
  id: string;
  managerId: string;
  managerIds: string[];
  manager: Employee;
  subordinates: Employee[];
}

const employeeData: Employee[] = [];

const treeData: string[][] = [];

let maxLevel = 0;

function updateMaxLevel(managerIds: string[]): void {
  const thisLevel = managerIds.length + 1;
  if (thisLevel > maxLevel) {
    maxLevel = thisLevel;
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
    subordinate.managerIds = [...employee.managerIds, subordinate.managerId];
    updateMaxLevel(subordinate.managerIds);

    updateSubordinates(subordinate);
  });
}

function addEmployeeToTree(employee: Employee): void {
  if (employee.managerId && !employee.manager) {
    treeData.push([`ID:${employee.managerId}`]);
  }
  const row: Array<string> = new Array(maxLevel);
  row[employee.managerIds.length] = employee.name;
  treeData.push(row);
  employee.subordinates.forEach(e => {
    addEmployeeToTree(e);
  });
}

fs.createReadStream('src/table.csv')
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
        employee.managerIds = [...manager.managerIds, employee.managerId];
      } else {
        employee.managerIds = [employee.managerId];
      }
    } else {
      employee.managerIds = [];
    }
    updateMaxLevel(employee.managerIds);

    employee.subordinates = findSubordinates(employee.id);
    updateSubordinates(employee);
  })
  .on('end', () => {
    const headers: string[] = generateHeaders(maxLevel);

    treeData.push(headers);

    employeeData
      .filter(e => !e.manager)
      .forEach(root => {
        addEmployeeToTree(root);
      });

    const ws = fs.createWriteStream('src/tree.csv');
    fastcsv.write(treeData, { headers: true }).pipe(ws);
  });
