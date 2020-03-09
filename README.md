# organisation-hierarchy-tree

Below is employee data of a small company. It represents the hierarchical relationship among employees. CEO of the company doesn't have a manager.

| Employee Name | id  | Manager id |
| ------------- | --- | ---------- |
| Alan          | 100 | 150        |
| Martin        | 220 | 100        |
| Jamie         | 150 |            |
| Alex          | 275 | 100        |
| Steve         | 400 | 150        |
| David         | 190 | 400        |

The data above is provided in a CSV file. This application will display the organisation hierarchy as below in another CSV file:

| 1     | 2     | 3     |
| ----- | ----- | ----- |
| Jamie |       |       |
|       | Alan  |       |
|       |       | Matin |
|       |       | Alex  |
|       | Steve |       |
|       |       | David |

## Input and Output

- Input from src/table.csv file with the column headers `name,id,managerId`.

- Output to src/tree.csv file using management levels as the column headers. e.g. `1,2,3`

## Pros and Cons

### Pros

- employee.name is optional, it will display `ID:[employee.id]` as its name if there is no employee.name, e.g. `ID:530`.

### Cons

- employee.id is required.

- employees aren't sorted by employee.name.

- focused on logic implementation and didn't TDD.

## How to run

- prepare src/table.csv with the hierarchical relationship data

- run `npm install`

- run `npm run dev`

- the organisation hierarchy tree will be in src/tree.csv
