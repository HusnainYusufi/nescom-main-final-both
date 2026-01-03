'use strict';

module.exports.routes = (app) => {
  app.use('/api/role', require('../features/role/controller/RoleController'));
  app.use('/api/user', require('../features/user/controller/UserController'));
  app.use('/api/auth', require('../features/auth/controller/AuthController'));
  app.use(
    '/api/project-category',
    require('../features/projectCategory/controller/ProjectCategoryController'),
  );
  app.use('/api/assembly', require('../features/assembly/controller/AssemblyController'));
  app.use('/api/structure', require('../features/structure/controller/StructureController'));
  app.use('/api/project', require('../features/project/controller/ProjectController'));
  app.use('/api/part', require('../features/part/controller/PartController'));
  app.use('/api/build-config', require('../features/buildConfig/controller/BuildConfigController'));
  app.use(
    '/api/qualification-test',
    require('../features/qualificationTest/controller/QualificationTestController'),
  );
  app.use('/api/set', require('../features/set/controller/SetController'));
  app.use('/api/status-entry', require('../features/status/controller/StatusController'));
  app.use('/api/issue', require('../features/issue/controller/IssueController'));
  app.use('/api/warehouse', require('../features/warehouse/controller/WarehouseController'));

};
