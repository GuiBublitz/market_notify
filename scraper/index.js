const routines = require('../routines');

const projects = {};

Object.keys(routines).forEach(routine => {
    projects[routine.toUpperCase()] = require(`./projects/${routine}`);
});

module.exports = projects;
