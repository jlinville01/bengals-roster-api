const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Bengals Roster API', () => {
    // Store IDs created during tests so we can clean up / reuse
    // let createdPlayerId;

    // afterEach('refresh data', async () => {
    //     // Clean up or reset the user object after each test
    //     const res = await chai.request(app)
    //     .post('/admin/refresh');

    //   expect(res).to.have.status(200);
    // });


    describe('GET /players', () => {
        it('should return an array of players', async () => {
            const res = await chai.request(app).get('/players');
            
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.be.greaterThan(0);

            const player = res.body[0];
            expect(player).to.have.property('id');
            expect(player).to.have.property('name');
            expect(player).to.have.property('number');
            expect(player).to.have.property('position');
        });
    });
});