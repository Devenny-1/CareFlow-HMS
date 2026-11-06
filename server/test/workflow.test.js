import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import request from 'supertest'

const databaseUri = process.env.TEST_MONGODB_URI
process.env.JWT_SECRET ??= 'test-secret-with-at-least-32-characters'
const { default: app } = await import('../src/app.js')

test('staff, registration, billing, triage, and visit workflow', { skip: !databaseUri && 'Set TEST_MONGODB_URI to a dedicated test database.' }, async () => {
  await mongoose.connect(databaseUri, { dbName: 'careflow_hms_test' })
  try {
    await mongoose.connection.dropDatabase()
    const models = Object.values(mongoose.models)
    await Promise.all(models.map((model) => model.syncIndexes()))
    const password = 'Test-Only-Password-984!'
    const admin = await mongoose.model('User').create({
      name: 'Test Administrator',
      email: 'admin@careflow.test',
      passwordHash: await bcrypt.hash(password, 4),
      role: 'admin',
    })
    const adminLogin = await request(app).post('/api/auth/login').send({ email: admin.email, password })
    assert.equal(adminLogin.status, 200)
    const adminToken = adminLogin.body.token

    const departmentResponse = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'General Medicine', code: 'GEN', description: 'Primary care' })
    assert.equal(departmentResponse.status, 201)
    const departmentId = departmentResponse.body.department._id

    const accounts = {}
    for (const role of ['receptionist', 'nurse', 'doctor', 'finance']) {
      const response = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test ${role}`,
          email: `${role}@careflow.test`,
          password,
          role,
          department: departmentId,
        })
      assert.equal(response.status, 201, `${role} account should be created`)
      accounts[role] = response.body.staff
    }

    const tokens = {}
    for (const role of Object.keys(accounts)) {
      const response = await request(app).post('/api/auth/login').send({ email: accounts[role].email, password })
      assert.equal(response.status, 200, `${role} account should sign in`)
      tokens[role] = response.body.token
    }

    const patientResponse = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${tokens.receptionist}`)
      .send({
        firstName: 'Sample',
        lastName: 'Patient',
        dateOfBirth: '1990-01-01',
        sex: 'undisclosed',
        phone: '+2348000000000',
      })
    assert.equal(patientResponse.status, 201)
    assert.match(patientResponse.body.patient.patientId, /^CF-\d{4}-[A-F0-9]+$/)
    assert.equal(patientResponse.body.invoice.status, 'pending')
    assert.equal(patientResponse.body.invoice.amount, 25000)

    const forbiddenInvoices = await request(app).get('/api/invoices').set('Authorization', `Bearer ${tokens.receptionist}`)
    assert.equal(forbiddenInvoices.status, 403)

    const visitResponse = await request(app)
      .post('/api/visits')
      .set('Authorization', `Bearer ${tokens.receptionist}`)
      .send({
        patient: patientResponse.body.patient._id,
        assignedDoctor: accounts.doctor._id,
        department: departmentId,
        reason: 'Initial consultation',
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
    assert.equal(visitResponse.status, 201)
    const visitId = visitResponse.body.visit._id

    const doctorSchedule = await request(app).get('/api/visits').set('Authorization', `Bearer ${tokens.doctor}`)
    assert.equal(doctorSchedule.status, 200)
    assert.equal(doctorSchedule.body.visits.length, 1)
    const doctorDashboard = await request(app).get('/api/dashboard/dashboard').set('Authorization', `Bearer ${tokens.doctor}`)
    assert.equal(doctorDashboard.body.dashboard.assignedVisits, 1)
    assert.deepEqual(doctorDashboard.body.dashboard.recentPatients, [])

    const vitalsResponse = await request(app)
      .patch(`/api/triage/${visitId}/vitals`)
      .set('Authorization', `Bearer ${tokens.nurse}`)
      .send({ temperatureC: 37, bloodPressureSystolic: 120, bloodPressureDiastolic: 80, heartRate: 72, oxygenSaturation: 98 })
    assert.equal(vitalsResponse.status, 200)
    assert.equal(vitalsResponse.body.visit.vitals.heartRate, 72)

    const completedVisit = await request(app)
      .patch(`/api/visits/${visitId}/status`)
      .set('Authorization', `Bearer ${tokens.doctor}`)
      .send({ status: 'completed' })
    assert.equal(completedVisit.status, 200)
    assert.equal(completedVisit.body.visit.status, 'completed')

    const invoiceId = patientResponse.body.invoice._id
    const paymentResponse = await request(app)
      .patch(`/api/invoices/${invoiceId}/pay`)
      .set('Authorization', `Bearer ${tokens.finance}`)
      .send({ method: 'bank_transfer', reference: 'TEST-TRANSFER-001' })
    assert.equal(paymentResponse.status, 200)
    assert.equal(paymentResponse.body.invoice.status, 'paid')
    assert.equal(paymentResponse.body.payment.amount, 25000)

    const duplicatePayment = await request(app)
      .patch(`/api/invoices/${invoiceId}/pay`)
      .set('Authorization', `Bearer ${tokens.finance}`)
      .send({ method: 'cash', reference: 'TEST-TRANSFER-002' })
    assert.equal(duplicatePayment.status, 409)

    const ledger = await request(app).get('/api/payments').set('Authorization', `Bearer ${tokens.finance}`)
    assert.equal(ledger.status, 200)
    assert.equal(ledger.body.payments.length, 1)

    const deactivatedDoctor = await request(app)
      .patch(`/api/staff/${accounts.doctor._id}/active`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false })
    assert.equal(deactivatedDoctor.status, 200)
    const revokedSession = await request(app).get('/api/visits').set('Authorization', `Bearer ${tokens.doctor}`)
    assert.equal(revokedSession.status, 401)
  } finally {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  }
})
