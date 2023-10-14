## CSYE6225 Assignment 3

### Git Command Workflow for adding origin
- git remote -v
- git remote add deep repo_name
- git remote remove origin
- git remote add upstream org_name

### Git Workflow
- git checkout -b branchName
- git add.
- git commit -m ""
- git push deep branchName
- Go to github and get pull request in organization
- git checkout main
- git pull upstream main
- git push deep main
- git checkout -b branchName2

### To install dependencies and run project
- Install node
- Run npm init --yes
- Run npm i 


- Use set command to add environment variable
- set PORT=3000
- Run node index.js to run the project
- Test using postman
- Run Get http://localhost:3000/healthz in postman to get status code 200

### To install mysql 
- Run npm install --save mysql2

