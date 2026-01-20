/* eslint-disable no-console */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

// Models
const Project = require('../features/project/model/Project.model')
const Assembly = require('../features/assembly/model/Assembly.model')
const Structure = require('../features/structure/model/Structure.model')
const Part = require('../features/part/model/Part.model')
const QualificationTest = require('../features/qualificationTest/model/QualificationTest.model')
const Meeting = require('../features/productionReview/model/Meeting.model')
const DiscussionPoint = require('../features/productionReview/model/DiscussionPoint.model')
const StatusEntry = require('../features/status/model/Status.model')
const BuildConfig = require('../features/buildConfig/model/BuildConfig.model')
const Issue = require('../features/issue/model/Issue.model')
const Warehouse = require('../features/warehouse/model/Warehouse.model')
const User = require('../features/user/model/User.model')
const Role = require('../features/role/model/Role.model')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pmc'

async function clearCollections() {
  console.log('Clearing existing data...')
  await Project.deleteMany({})
  await Assembly.deleteMany({})
  await Structure.deleteMany({})
  await Part.deleteMany({})
  await QualificationTest.deleteMany({})
  await Meeting.deleteMany({})
  await DiscussionPoint.deleteMany({})
  await StatusEntry.deleteMany({})
  await BuildConfig.deleteMany({})
  await Issue.deleteMany({})
  await Warehouse.deleteMany({})
  await User.deleteMany({})
  // Keep admin role
  console.log('Collections cleared')
}

async function seedRoles() {
  console.log('Seeding roles...')
  const roles = ['admin', 'production_lead', 'engineer', 'qc_analyst', 'warehouse_manager']
  for (const roleName of roles) {
    await Role.findOneAndUpdate({ name: roleName }, { name: roleName }, { upsert: true })
  }
  console.log('Roles seeded')
}

async function seedUsers() {
  console.log('Seeding users...')
  const adminRole = await Role.findOne({ name: 'admin' })
  const productionRole = await Role.findOne({ name: 'production_lead' })
  const engineerRole = await Role.findOne({ name: 'engineer' })
  const qcRole = await Role.findOne({ name: 'qc_analyst' })
  const warehouseRole = await Role.findOne({ name: 'warehouse_manager' })
  
  // Get admin credentials from environment variables (same as seedAdmin.js)
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'classified@example.local'
  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'classified-admin'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123'
  
  const users = [
    { username: adminUsername, email: adminEmail, password: adminPassword, role: adminRole._id },
    { username: 'prod_lead1', email: 'prod1@pmc.com', password: 'password', role: productionRole._id },
    { username: 'prod_lead2', email: 'prod2@pmc.com', password: 'password', role: productionRole._id },
    { username: 'engineer1', email: 'eng1@pmc.com', password: 'password', role: engineerRole._id },
    { username: 'engineer2', email: 'eng2@pmc.com', password: 'password', role: engineerRole._id },
    { username: 'engineer3', email: 'eng3@pmc.com', password: 'password', role: engineerRole._id },
    { username: 'qc1', email: 'qc1@pmc.com', password: 'password', role: qcRole._id },
    { username: 'qc2', email: 'qc2@pmc.com', password: 'password', role: qcRole._id },
    { username: 'warehouse1', email: 'wh1@pmc.com', password: 'password', role: warehouseRole._id },
    { username: 'warehouse2', email: 'wh2@pmc.com', password: 'password', role: warehouseRole._id },
  ]
  
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    await User.findOneAndUpdate(
      { email: userData.email },
      { ...userData, password: hashedPassword },
      { upsert: true }
    )
  }
  console.log('Users seeded')
}

async function seedWarehouses() {
  console.log('Seeding warehouses...')
  const warehouses = [
    { name: 'Main Warehouse A', address: { line1: '123 Industrial St', city: 'Karachi', country: 'Pakistan' }, contact: { person: 'John Doe', phone: '+92-300-1234567', email: 'warehouse1@pmc.com' } },
    { name: 'Warehouse B', address: { line1: '456 Factory Rd', city: 'Lahore', country: 'Pakistan' }, contact: { person: 'Jane Smith', phone: '+92-300-2345678', email: 'warehouse2@pmc.com' } },
    { name: 'Storage Facility C', address: { line1: '789 Manufacturing Ave', city: 'Islamabad', country: 'Pakistan' }, contact: { person: 'Bob Johnson', phone: '+92-300-3456789', email: 'warehouse3@pmc.com' } },
    { name: 'Distribution Center D', address: { line1: '321 Supply Chain Blvd', city: 'Faisalabad', country: 'Pakistan' }, contact: { person: 'Alice Brown', phone: '+92-300-4567890', email: 'warehouse4@pmc.com' } },
    { name: 'Regional Warehouse E', address: { line1: '654 Logistics Way', city: 'Multan', country: 'Pakistan' }, contact: { person: 'Charlie Wilson', phone: '+92-300-5678901', email: 'warehouse5@pmc.com' } },
    { name: 'Central Storage F', address: { line1: '987 Material St', city: 'Rawalpindi', country: 'Pakistan' }, contact: { person: 'Diana Lee', phone: '+92-300-6789012', email: 'warehouse6@pmc.com' } },
    { name: 'North Warehouse G', address: { line1: '147 Assembly Rd', city: 'Peshawar', country: 'Pakistan' }, contact: { person: 'Edward Chen', phone: '+92-300-7890123', email: 'warehouse7@pmc.com' } },
    { name: 'South Warehouse H', address: { line1: '258 Production Ave', city: 'Hyderabad', country: 'Pakistan' }, contact: { person: 'Fiona Taylor', phone: '+92-300-8901234', email: 'warehouse8@pmc.com' } },
    { name: 'East Warehouse I', address: { line1: '369 Quality Blvd', city: 'Quetta', country: 'Pakistan' }, contact: { person: 'George Martinez', phone: '+92-300-9012345', email: 'warehouse9@pmc.com' } },
    { name: 'West Warehouse J', address: { line1: '741 Testing Way', city: 'Sialkot', country: 'Pakistan' }, contact: { person: 'Helen Anderson', phone: '+92-300-0123456', email: 'warehouse10@pmc.com' } },
  ]
  
  const createdWarehouses = await Warehouse.insertMany(warehouses)
  console.log('Warehouses seeded')
  return createdWarehouses
}

async function seedAssemblies() {
  console.log('Seeding assemblies...')
  const assemblies = [
    { name: 'Main Assembly Unit 1', type: 'assembly', notes: 'Primary assembly component' },
    { name: 'Sub Assembly 1A', type: 'sub-assembly', notes: 'Sub-component of main assembly' },
    { name: 'Control Module Assembly', type: 'assembly', notes: 'Control system assembly' },
    { name: 'Power Distribution Assembly', type: 'assembly', notes: 'Power management unit' },
    { name: 'Sensor Array Assembly', type: 'assembly', notes: 'Sensor integration module' },
    { name: 'Communication Assembly', type: 'assembly', notes: 'Communication system' },
    { name: 'Navigation Assembly', type: 'assembly', notes: 'Navigation and guidance' },
    { name: 'Payload Assembly', type: 'assembly', notes: 'Payload integration' },
    { name: 'Structural Frame Assembly', type: 'assembly', notes: 'Main structural frame' },
    { name: 'Thermal Management Assembly', type: 'assembly', notes: 'Cooling and thermal control' },
  ]
  
  const createdAssemblies = await Assembly.insertMany(assemblies)
  
  // Set parent for sub-assembly
  if (createdAssemblies.length > 1) {
    createdAssemblies[1].parentAssembly = createdAssemblies[0]._id
    await createdAssemblies[1].save()
  }
  
  console.log('Assemblies seeded')
  return createdAssemblies
}

async function seedStructures() {
  console.log('Seeding structures...')
  const structures = [
    { name: 'Primary Structure A', materialSpecs: 'Aluminum 6061', notes: 'Main structural component' },
    { name: 'Secondary Structure B', materialSpecs: 'Steel 304', notes: 'Support structure' },
    { name: 'Frame Structure C', materialSpecs: 'Titanium', notes: 'Frame assembly' },
    { name: 'Housing Structure D', materialSpecs: 'Composite Material', notes: 'Protective housing' },
    { name: 'Mount Structure E', materialSpecs: 'Aluminum 7075', notes: 'Mounting structure' },
    { name: 'Base Structure F', materialSpecs: 'Steel 316', notes: 'Base platform' },
    { name: 'Support Structure G', materialSpecs: 'Carbon Fiber', notes: 'Support beams' },
    { name: 'Enclosure Structure H', materialSpecs: 'Aluminum 2024', notes: 'Enclosure frame' },
    { name: 'Bracket Structure I', materialSpecs: 'Stainless Steel', notes: 'Mounting brackets' },
    { name: 'Chassis Structure J', materialSpecs: 'Aluminum Alloy', notes: 'Main chassis' },
  ]
  
  const createdStructures = await Structure.insertMany(structures)
  console.log('Structures seeded')
  return createdStructures
}

async function seedProjects(assemblies, structures) {
  console.log('Seeding projects...')
  const systems = ['Arial', 'Ballistic', 'Cruise']
  const configurations = ['special', 'conventional']
  
  const projects = []
  for (let i = 0; i < 10; i++) {
    const system = systems[i % 3]
    const config = configurations[i % 2]
    
    const sets = []
    const numSets = i < 3 ? 3 : i < 6 ? 2 : 1 // Distribute sets
    
    for (let j = 0; j < numSets; j++) {
      const setAssemblies = assemblies.slice(j * 2, (j + 1) * 2).map(a => a._id)
      const setStructures = structures.slice(j, j + 1).map(s => s._id)
      
      sets.push({
        name: `Set ${j + 1}`,
        description: `Set ${j + 1} for Project ${i + 1}`,
        materialSpecs: 'Standard Material',
        assemblies: setAssemblies,
        structures: setStructures,
      })
    }
    
    projects.push({
      name: `${system} Project ${i + 1}`,
      code: `PRJ-${system.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
      system,
      configuration: config,
      status: i < 3 ? 'In Progress' : i < 6 ? 'Draft' : 'Pending',
      shortDescription: `${system} system project with ${config} configuration`,
      sets,
      structures: structures.slice(i, i + 2).map(s => s._id),
    })
  }
  
  const createdProjects = await Project.insertMany(projects)
  console.log('Projects seeded')
  return createdProjects
}

async function seedParts(projects, assemblies) {
  console.log('Seeding parts...')
  const parts = []
  const partTypes = ['Mechanical', 'Electrical', 'Ablative', 'Composite']
  
  // Get all sets from all projects
  const allSets = []
  projects.forEach(project => {
    project.sets.forEach((set, idx) => {
      allSets.push({ projectId: project._id, setId: set._id, setName: set.name })
    })
  })
  
  for (let i = 0; i < 10; i++) {
    const setInfo = allSets[i % allSets.length]
    const project = projects.find(p => p._id.toString() === setInfo.projectId.toString())
    const assembly = assemblies[i % assemblies.length]
    const partType = partTypes[i % partTypes.length]
    const isQualified = i < 5
    
    // Find the set in the project
    const setInProject = project.sets.find(s => s._id.toString() === setInfo.setId.toString())
    
    const partData = {
      name: `Part ${i + 1}`,
      code: `PART-${String(i + 1).padStart(4, '0')}`,
      category: `Category ${(i % 5) + 1}`,
      type: `Type ${(i % 3) + 1}`,
      level: `Level ${(i % 4) + 1}`,
      status: isQualified ? 'Active' : 'Draft',
      owner: `Engineer ${(i % 3) + 1}`,
      description: `Description for Part ${i + 1}`,
      drawingNo: `DWG-${String(i + 1).padStart(5, '0')}`,
      partIdNo: `PID-${String(i + 1).padStart(6, '0')}`,
      project: project._id,
      set: setInfo.setId,
      parentPart: i > 0 && i % 3 === 0 ? (parts[i - 1]?._id || null) : null,
      assembly: assembly._id,
      structure: project.structures && project.structures.length > 0 ? project.structures[i % project.structures.length] : null,
      // New fields
      partType,
      isQualified,
    }
    
    // Add type-specific fields
    if (partType === 'Mechanical') {
      partData.designNumber = `DSN-${String(i + 1).padStart(5, '0')}`
      partData.revisionNumber = `Rev ${String.fromCharCode(65 + (i % 5))}`
      partData.revisionDate = new Date(Date.now() - i * 86400000 * 30)
    } else {
      partData.partIdOrReference = `REF-${partType.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(4, '0')}`
    }
    
    // Add qualification report if qualified
    if (isQualified) {
      partData.qualificationReport = {
        name: `QR-${String(i + 1).padStart(4, '0')}.pdf`,
        url: `/uploads/qualification/qr-${i + 1}.pdf`,
        uploadedAt: new Date(Date.now() - i * 86400000 * 7),
      }
    } else {
      // Add NCR if not qualified
      partData.ncr = {
        number: `NCR-${String(i + 1).padStart(4, '0')}`,
        report: {
          name: `NCR-Report-${String(i + 1).padStart(4, '0')}.pdf`,
          url: `/uploads/ncr/ncr-${i + 1}.pdf`,
          uploadedAt: new Date(Date.now() - i * 86400000 * 3),
        },
      }
    }
    
    parts.push(partData)
  }
  
  const createdParts = await Part.insertMany(parts)
  
  // Link parts to assemblies
  for (let i = 0; i < assemblies.length && i < createdParts.length; i++) {
    const partsToLink = createdParts.slice(i, i + 2).map(p => p._id)
    await Assembly.findByIdAndUpdate(assemblies[i]._id, { parts: partsToLink })
  }
  
  console.log('Parts seeded')
  return createdParts
}

async function seedQualificationTests(projects, parts) {
  console.log('Seeding qualification tests...')
  const tests = []
  
  for (let i = 0; i < 10; i++) {
    const part = parts[i]
    const project = projects[i % projects.length]
    
    tests.push({
      title: `QC Test ${i + 1}`,
      status: i < 5 ? 'Passed' : 'Pending',
      owner: `QC Analyst ${(i % 2) + 1}`,
      date: new Date(Date.now() - i * 86400000),
      remarks: `Test remarks for part ${i + 1}`,
      documentType: 'PDF',
      partId: part.code,
      document: i < 3 ? {
        name: `test-document-${i + 1}.pdf`,
        url: `/uploads/tests/test-${i + 1}.pdf`,
        size: 1024 * (i + 1),
        type: 'application/pdf',
      } : null,
      project: project._id,
      part: part._id,
      assembly: part.assembly,
    })
  }
  
  const createdTests = await QualificationTest.insertMany(tests)
  console.log('Qualification tests seeded')
  return createdTests
}

async function seedMeetings() {
  console.log('Seeding meetings...')
  const meetings = []
  let prmCount = 1
  let prePrmCount = 1
  
  for (let i = 0; i < 10; i++) {
    const isPRM = i < 5
    const meetingNo = isPRM ? `PRM-${String(prmCount++).padStart(3, '0')}` : `PRE-PRM-${String(prePrmCount++).padStart(3, '0')}`
    
    meetings.push({
      meetingType: isPRM ? 'PRM' : 'PRE-PRM',
      meetingDate: new Date(Date.now() - (10 - i) * 7 * 86400000),
      meetingNo,
    })
  }
  
  const createdMeetings = await Meeting.insertMany(meetings)
  console.log('Meetings seeded')
  return createdMeetings
}

async function seedDiscussionPoints(projects, meetings) {
  console.log('Seeding discussion points...')
  const prmMeetings = meetings.filter(m => m.meetingType === 'PRM')
  const discussionPoints = []
  
  // Get all sets from all projects
  const allSets = []
  projects.forEach(project => {
    project.sets.forEach((set) => {
      allSets.push({ projectId: project._id, setId: set._id, setName: set.name })
    })
  })
  
  for (let i = 0; i < 10; i++) {
    const setInfo = allSets[i % allSets.length]
    const project = projects.find(p => p._id.toString() === setInfo.projectId.toString())
    const meeting = prmMeetings[i % prmMeetings.length]
    
    discussionPoints.push({
      project: project._id,
      set: setInfo.setId,
      meeting: meeting._id,
      discussionPoint: `Discussion point ${i + 1} regarding ${setInfo.setName} in ${project.name}`,
    })
  }
  
  const createdDiscussionPoints = await DiscussionPoint.insertMany(discussionPoints)
  console.log('Discussion points seeded')
  return createdDiscussionPoints
}

async function seedStatusEntries(projects, meetings, parts) {
  console.log('Seeding status entries...')
  const statusTypes = ['PRM', 'PRE-PRM', 'CURRENT']
  const statuses = ['In Progress', 'Pending', 'Complete', 'Draft', 'Under Review']
  
  // Get all sets from all projects
  const allSets = []
  projects.forEach(project => {
    project.sets.forEach((set) => {
      allSets.push({ projectId: project._id, setId: set._id, setName: set.name })
    })
  })
  
  const statusEntries = []
  for (let i = 0; i < 10; i++) {
    const setInfo = allSets[i % allSets.length]
    const project = projects.find(p => p._id.toString() === setInfo.projectId.toString())
    const part = parts[i % parts.length]
    const statusType = statusTypes[i % 3]
    const meeting = statusType !== 'CURRENT' ? meetings[i % meetings.length] : null
    
    statusEntries.push({
      project: project._id,
      set: setInfo.setId,
      setName: setInfo.setName,
      part: part._id,
      partName: part.name,
      status: statuses[i % statuses.length],
      statusType,
      meeting: meeting?._id || null,
      processOwner: `Owner ${(i % 3) + 1}`,
      remarks: `Status remarks for ${part.name}`,
      updatedOn: new Date(Date.now() - i * 86400000),
    })
  }
  
  const createdStatusEntries = await StatusEntry.insertMany(statusEntries)
  console.log('Status entries seeded')
  return createdStatusEntries
}

async function seedBuildConfigs(projects, parts) {
  console.log('Seeding build configs...')
  const buildConfigs = []
  
  for (let i = 0; i < 10; i++) {
    const project = projects[i % projects.length]
    const assembly = project.sets[0]?.assemblies?.[0] || null
    const items = parts.slice(i, i + 3).map((part, idx) => ({
      part: part._id,
      quantity: idx + 1,
      position: `Position ${idx + 1}`,
      notes: `Notes for ${part.name}`,
    }))
    
    buildConfigs.push({
      project: project._id,
      assembly,
      status: i < 5 ? 'Active' : 'Draft',
      items,
    })
  }
  
  const createdBuildConfigs = await BuildConfig.insertMany(buildConfigs)
  console.log('Build configs seeded')
  return createdBuildConfigs
}

async function seedIssues(projects, parts) {
  console.log('Seeding issues...')
  const severities = ['Low', 'Medium', 'High', 'Critical']
  const statuses = ['Open', 'In Progress', 'Resolved', 'Closed']
  
  // Get all sets from all projects
  const allSets = []
  projects.forEach(project => {
    project.sets.forEach((set) => {
      allSets.push({ projectId: project._id, setId: set._id, setName: set.name })
    })
  })
  
  const issues = []
  for (let i = 0; i < 10; i++) {
    const setInfo = allSets[i % allSets.length]
    const project = projects.find(p => p._id.toString() === setInfo.projectId.toString())
    const part = parts[i % parts.length]
    
    issues.push({
      title: `Issue ${i + 1}: Problem with ${part.name}`,
      project: project._id,
      set: setInfo.setId,
      part: part._id,
      severity: severities[i % severities.length],
      status: statuses[i % statuses.length],
      assignedTo: `Engineer ${(i % 3) + 1}`,
      remarks: `Issue description for ${part.name}`,
    })
  }
  
  const createdIssues = await Issue.insertMany(issues)
  console.log('Issues seeded')
  return createdIssues
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('MongoDB connected')
    
    await clearCollections()
    await seedRoles()
    await seedUsers()
    const warehouses = await seedWarehouses()
    const assemblies = await seedAssemblies()
    const structures = await seedStructures()
    const projects = await seedProjects(assemblies, structures)
    const parts = await seedParts(projects, assemblies)
    const qualificationTests = await seedQualificationTests(projects, parts)
    const meetings = await seedMeetings()
    const discussionPoints = await seedDiscussionPoints(projects, meetings)
    const statusEntries = await seedStatusEntries(projects, meetings, parts)
    const buildConfigs = await seedBuildConfigs(projects, parts)
    const issues = await seedIssues(projects, parts)
    
    console.log('\n=== Seeding Summary ===')
    console.log(`Projects: ${projects.length}`)
    console.log(`Assemblies: ${assemblies.length}`)
    console.log(`Structures: ${structures.length}`)
    console.log(`Parts: ${parts.length}`)
    console.log(`Qualification Tests: ${qualificationTests.length}`)
    console.log(`Meetings: ${meetings.length}`)
    console.log(`Discussion Points: ${discussionPoints.length}`)
    console.log(`Status Entries: ${statusEntries.length}`)
    console.log(`Build Configs: ${buildConfigs.length}`)
    console.log(`Issues: ${issues.length}`)
    console.log(`Warehouses: ${warehouses.length}`)
    console.log('========================\n')
    
    console.log('All data seeded successfully!')
  } catch (error) {
    console.error('Seeding failed:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('MongoDB disconnected')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed script failed:', error.message)
    process.exit(1)
  })
