# organisation-hierarchy

## Input and Output

- Input from src/table.csv file in same diretory of src/index.ts

- Output to src/tree.csv file in same diretory of src/index.ts

## Pros and Cons

### Pros

- employee.name is optional, will display ID:\[employee.id\] as its name, e.g. ID:530

### Cons

- doesn't sort by employee.name

- employee.id must be unique

## How to run

- prepare src/table.csv with employees' hierarchical relationship data

- run `npm install`

- run `npm run dev `

- the organisation hierarchy tree will be src/tree.csv
