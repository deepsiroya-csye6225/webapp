const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcrypt');
const {Assignment, Account, AccAssignment} = require('./models');
const { sequelize } = require('./models');
const auth = require('./auth');
const logger = require('./logger');
const statsd = require('./node-statsD');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));


sequelize.authenticate().then(() => {
  console.log('Connection has been established successfully.');
}).catch((error) => {
  console.error('Unable to connect to the database: ', error);
});


// app.use(async (req, res, next) => {
//   try {
//       await sequelize.authenticate();
//       next();
//   } catch (error) {
//       console.error('Database connection error:', error);
//       res.status(503).send();
//   }
// });

 //get username from request
const getEmail = (req) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ message: 'Authentication header missing or invalid' });
    }

    // Extract and decode the Base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');
    return email;
  };

  const authUser = async (email, id) => {
    const sql1 = await Account.findOne({ where: { email: email } });
    const ownerId1 = sql1.dataValues.id;
    const sql2 = await AccAssignment.findOne({ where: { assign_Id: id } });
  
    const ownerId2 = sql2.dataValues.acc_Id;
  
    if (ownerId1 != ownerId2) {
      return false;
    } else {
      return true;
    }
  };


// GET /v1/assignments
app.get('/v1/assignments', auth, async (req, res) => {
    try {
      // Retrieve a list of all assignments
      const assignments = await Assignment.findAll();
      logger.info('Getting all assignments.'); 
      statsd.increment('get_all_assign.metric.count');
      res.status(200).json(assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // POST /v1/assignments
  app.post('/v1/assignments', auth, async (req, res) => {
    try {

        const fields = req.body;
        for (const key in fields) {
          if ( key !== "name" && key !== "points" && key !== "num_of_attempts" && key !== "deadline" ) {
            return res.status(400).json({error: "Bad Request: Invalid field in request body"});
          }
        }
    
        //to check if any input fields is null
        if (!req.body.name == null || !req.body.points || !req.body.num_of_attempts || !req.body.deadline == null) {
          return res.status(400).json({error: "Bad Request: Missing field in request body"});
        }

      const email = getEmail(req);
    
      let { name, points, num_of_attempts, deadline } = req.body;

      const accUser = await Account.findOne({ where: { email: email } });

      if (typeof name !== 'string') {
        return res.status(400).json({ error: 'Assignment name must be a string.' });
      }

      points = parseInt(req.body.points);

      if (isNaN(points) || !Number.isInteger(points) || points < 1 || points > 10) {
          return res.status(400).json({ error: 'Assignment points must be a numeric value between 1 and 10.' });
      }
  
      // Create a new assignment
      const newAssignment = await Assignment.create({
        name,
        points,
        num_of_attempts,
        deadline
      });

      await AccAssignment.create({
        acc_Id: accUser.id,
        assign_Id: newAssignment.id,
      });
  
      
      logger.info(`A new assignment created with id: ${newAssignment.id}`); 
      statsd.increment('post_assign.metric.count');
      res.status(201).json(newAssignment);
    } catch (error) {
      console.error('Error creating assignment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // GET /v1/assignments/{id}
  app.get('/v1/assignments/:id', auth, async (req, res) => {
    try {
      const assignmentId = req.params.id;
  
      // Find the assignment by ID
      const assignment = await Assignment.findByPk(assignmentId);
  
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
  
      
      logger.info(`Getting assignment with id: ${assignmentId}`); 
      statsd.increment('get_assign.metric.count');
      res.status(200).json(assignment);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // DELETE /v1/assignments/{id}
  app.delete('/v1/assignments/:id', auth, async (req, res) => {
    try {
      const email = getEmail(req);
      const assignmentId = req.params.id;
  
      // Find the assignment by ID
      const assignment = await Assignment.findByPk(assignmentId);
  
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
  
      // Delete the assignment
      if (await authUser(email, assignmentId)) {
        await AccAssignment.destroy({ where: { assign_Id: assignmentId } });
        const results = await Assignment.destroy({ where: { id: assignmentId } });
        logger.info(`A assignment is deleted with id: ${assignmentId}`); 
        statsd.increment('delete_assign.metric.count');
        res.status(204).send();
      } else {
        statsd.increment('delete_assign.metric.count');
        res.status(403).send({ message: "Forbidden" });
      }

    } catch (error) {
      console.error('Error deleting assignment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // PUT /v1/assignments/{id}
  app.put('/v1/assignments/:id', auth, async (req, res) => {
    try {

      const email = getEmail(req);

      const assignmentId = req.params.id;
      let { name, points, num_of_attempts, deadline } = req.body;
  
      // Find the assignment by ID
      const assignment = await Assignment.findByPk(assignmentId);
  
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      if (await authUser(email, assignmentId)) {
        const fields = req.body;
        for (const key in fields) {
          if ( key !== "name" && key !== "points" && key !== "num_of_attempts" && key !== "deadline" ) {
            return res.status(400).json({error: "Bad Request: Invalid field in request body"});
          }
        }
    
        //to check if any input fields is null
        if (!req.body.name == null || !req.body.points || !req.body.num_of_attempts || !req.body.deadline == null) {
          return res.status(400).json({error: "Bad Request: Missing field in request body"});
        }

        if (typeof name !== 'string') {
          return res.status(400).json({ error: 'Assignment name must be a string.' });
        }

        points = parseInt(req.body.points);

        if (isNaN(points) || !Number.isInteger(points) || points < 1 || points > 10) {
            return res.status(400).json({ error: 'Assignment points must be a numeric value between 1 and 10.' });
        }
      
  
        assignment.name = name;
        assignment.points = points;
        assignment.num_of_attempts = num_of_attempts;
        assignment.deadline = deadline;
        assignment.assignment_updated = new Date();
    
        await assignment.save();
    
        statsd.increment('update_assign.metric.count');
        logger.info(`A assignment is updated with id: ${assignmentId}`); 
        res.status(200).json(assignment);
      } else {
        statsd.increment('update_assign.metric.count');
        res.status(403).send({ message: "Forbidden" });
      }
      
    } catch (error) {
      console.error('Error updating assignment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/v1/assignments/:id', (req, res) => {
    statsd.increment('patch_assign.metric.count');
    res.status(405).end();
  });

app.get('/healthz', async (req, res) => {
  try {
    await sequelize.authenticate();
    statsd.increment('get_health.metric.count');
    if (Object.keys(req.query).length > 0 || Object.keys(req.body).length > 0) {
      return res.status(400).set(headers).end();
    }
    res.status(200).end();
  } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
  }
  
});

app.all('/healthz', (req, res) => {
  res.status(405).end();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;