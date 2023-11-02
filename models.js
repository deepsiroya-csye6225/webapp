const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const fs = require('fs');
const csv = require('csv-parser');
const { DataTypes } = require('sequelize');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOSTNAME,
      dialect: 'mysql',
    }
  );

const Account = sequelize.define('accounts', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(), // Generate a UUID as the default value
        primaryKey: true,
        allowNull: false,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: true,
});

const Assignment = sequelize.define('assignments', {
    id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(), // Generate a UUID as the default value
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    points: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 10,
        },
    },
    num_of_attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    timestamps: true,
});

const AccAssignment = sequelize.define('accassignments', {
    acc_Id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    assign_Id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
});

AccAssignment.belongsTo(Account, { foreignKey: 'acc_Id' });
AccAssignment.belongsTo(Assignment, { foreignKey: 'assign_Id' });

const bootstrappingDB = async () => {
    try {
              const acc = [];
              // const csvFilePath = path.join(__dirname, './opt/users.csv');
        
              const readStream = fs.createReadStream('./opt/users.csv');
              const csvParser = csv();
              readStream.pipe(csvParser);
        
        
              for await (const row of csvParser) {
                  const { first_name, last_name, email, password } = row;
        
                  const existingAccount = await Account.findOne({ where: { email } });
        
                  if (!existingAccount) {
                      const hashedPassword = await bcrypt.hash(password, 10);
                      acc.push({ first_name, last_name, email, password: hashedPassword });
                  } else {
                      console.log(`Account with email ${email} already exists.`);
                  }
              }
        
              if (acc.length > 0) {
                  await Account.bulkCreate(acc);
                  console.log('User accounts loaded and created successfully.');
              } else {
                  console.log('No new user accounts to create.');
              }
            } catch (error) {
              console.error('Error loading user accounts from CSV:', error);
            }
};

sequelize
    .sync()
    .then(() => {
        bootstrappingDB();
    })
    .catch((error) => {
        console.error('Database synchronization error:', error);
    });

module.exports = { sequelize, 
        Account,
        Assignment,
        AccAssignment,};
