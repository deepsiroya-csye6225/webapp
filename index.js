const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcrypt');
const {Assignment, Account, AccAssignment, Submission} = require('./models');
const { sequelize } = require('./models');
const auth = require('./auth');
const logger = require('./logger');
const statsd = require('./node-statsD');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const sns = new AWS.SNS();

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
app.get('/v2/assignments', auth, async (req, res) => {
    try {
      if (Object.keys(req.query).length > 0 || Object.keys(req.body).length > 0) {
        res.status(400).end();
      }
      const assignments = await Assignment.findAll();
      logger.info('Getting all assignments.'); 
      statsd.increment('get_all_assign.metric.count');
      if (!assignments) {
        logger.info('Assignments not found.'); 
        return res.status(404).json({ message: 'Assignments not found' });
      }
      res.status(200).json(assignments);
    } catch (error) {
      logger.error('Error fetching all assignments.'); 
      console.error('Error fetching assignments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // POST /v2/assignments
  app.post('/v2/assignments', auth, async (req, res) => {
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

      if (!Number.isInteger(points) || points < 1 || points > 10) {
        return res.status(400).json({ error: 'Assignment points must be an integer value between 1 and 10.' });
      }


      if (!Number.isInteger(num_of_attempts) || num_of_attempts < 0) {
        return res.status(400).json({ error: 'Assignment attempts must be a numeric value greater than 0.' });
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
      logger.error('Error creating new assignment.');
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // GET /v1/assignments/{id}
  app.get('/v2/assignments/:id', auth, async (req, res) => {
    const assignmentId = req.params.id;
    try {

      if (Object.keys(req.query).length > 0 || Object.keys(req.body).length > 0) {
        res.status(400).end();
      }
  
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
      logger.error(`Error fetching assignment with id: ${assignmentId}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // DELETE /v1/assignments/{id}
  app.delete('/v2/assignments/:id', auth, async (req, res) => {
    const assignmentId = req.params.id;
    try {

      if (Object.keys(req.query).length > 0 || Object.keys(req.body).length > 0) {
        return res.status(400).send();
      }

      const email = getEmail(req);
  
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
      logger.error(`Error deleting assignment with id: ${assignmentId}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // PUT /v1/assignments/{id}
  app.put('/v2/assignments/:id', auth, async (req, res) => {
    const assignmentId = req.params.id;
    try {

      const email = getEmail(req);

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
        res.status(204).json(assignment);
      } else {
        statsd.increment('update_assign.metric.count');
        res.status(403).send({ message: "Forbidden" });
      }
      
    } catch (error) {
      console.error('Error updating assignment:', error);
      logger.error(`Error updating assignment with id: ${assignmentId}`);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/v2/assignments/:id/submissions', auth, async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const userEmail = getEmail(req);
        const { submission_url } = req.body;

        const assignment = await Assignment.findByPk(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        const currentDate = new Date();
        if (currentDate > assignment.deadline) {
            return res.status(400).json({ message: 'Assignment deadline has passed' });
        }

        const userAccount = await Account.findOne({ where: { email: userEmail } });

        // Fetch or create AccAssignment entry for the user and assignment
        let [accAssignment, created] = await AccAssignment.findOrCreate({
            where: {
                acc_Id: userAccount.id, 
                assign_Id: assignmentId,
            },
            defaults: {
                submission_attempts: 0,
            },
        });

        const maxRetries = assignment.num_of_attempts;

        if (accAssignment.submission_attempts >= maxRetries) {
            return res.status(400).json({ message: 'Exceeded maximum submission attempts' });
        }

        // Create the submission
        await Submission.create({
            assignment_id: assignmentId,
            submission_url: submission_url,
            submission_date: currentDate,
        });

        statsd.increment('submit_assign.metric.count');
        logger.info(`A assignment is submitted with id: ${assignmentId}`); 

        // Increment submission_attempts count
        if (!created) {
          accAssignment.submission_attempts += 1;
          await accAssignment.save();
        }

        const sns = new AWS.SNS();

        const params = {
          Message: JSON.stringify({
              email: userEmail, 
              url: submission_url, 
          }),
          TopicArn: process.env.SNS_TOPIC_ARN, 
        };
        
        sns.publish(params, (err, data) => {
            if (err) console.error('Error publishing to SNS:', err);
            else console.log('Published to SNS:', data);
        });

        return res.status(201).json({ message: 'Submission successful' });
    } catch (error) {
        console.error('Error creating submission:', error);
        logger.error(`Error submitting assignment with id: ${assignmentId}`);
        return res.status(500).json({ message: 'Internal server error' });
    }
});



  app.patch('/v2/assignments/:id', (req, res) => {
    statsd.increment('patch_assign.metric.count');
    logger.info('Patch method not allowed');
    res.status(405).end();
  });

  let firstCall = true;

  // Health check endpoint
  app.get('/healthz', (req, res) => {
      statsd.increment('get_health.metric.count');
      if (firstCall) {
          firstCall = false; // Toggle the flag after the first check
          logger.info('Checking healthz router');
          return res.status(200).end();
      }
  
      // Check the database connection status for subsequent calls
      sequelize.authenticate()
          .then(() => {
            logger.info('Checking healthz router');
            res.status(200).end();
          })
          .catch((error) => {
              console.error('Database connection error:', error);
              res.status(503).end();
          });
  });
  

app.all('/healthz', (req, res) => {
  logger.info(`${req.method} is not allowed for /healthz`);
  res.status(405).end();
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
