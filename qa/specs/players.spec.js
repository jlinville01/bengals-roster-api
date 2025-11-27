const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../server');

const expect = chai.expect;
chai.use(chaiHttp);

afterEach(async () => {
  const res = await chai.request(app).post('/admin/refresh');
  expect(res).to.have.status(200);
});

describe('Bengals Roster API', () => {

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

        it('should filter players by position (WR)', async () => {
            const res = await chai.request(app)
                .get('/players')
                .query({ position: 'WR' });

            res.body.forEach((p) => {
                expect(p.position.toUpperCase()).to.equal('WR');
            });
        });

        it('should support name substring filter', async () => {
            const res = await chai.request(app)
                .get('/players')
                .query({ name: 'burrow' });

            res.body.forEach((p) => {
                expect(p.name.toLowerCase()).to.include('burrow');
            });
        });

        it('should return Joe Burrow for ID 9', async () => {
            const res = await chai.request(app).get('/players');
            const player = res.body[9];

            expect(player.name).to.eql('Joe Burrow');
        });
    });

    describe('GET /players/:id', () => {
        it('should return a single player by id', async () => {
            const res = await chai.request(app)
                .get('/players/10');

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('name', 'Joe Burrow');
        });

        it('should return 404 for non-existing id', async () => {
            const res = await chai.request(app)
                .get('/players/999999');

            expect(res).to.have.status(404);
            expect(res.body).to.have.property('error');
        });

        it('should return 400 for invalid id format', async () => {
            const res = await chai.request(app)
                .get('/players/not-a-number');

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('error');
        });
    });

    describe('POST /players', () => {
        it('should create a new player with valid payload', async () => {
            const newPlayer = {
                name: 'Justin Linville',
                number: 17,
                position: 'LB',
                age: 37,
                height: '5-11',
                weight: 190,
                college: 'Santa Monica College'
            };

            const res = await chai.request(app)
                .post('/players')
                .send(newPlayer);

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('id');
            expect(res.body).to.include({
                name: newPlayer.name,
                number: newPlayer.number,
                position: newPlayer.position,
                age: newPlayer.age,
                height: newPlayer.height,
                weight: newPlayer.weight,
                college: newPlayer.college
            });
        });

        it('should fail with validation errors for invalid payload', async () => {
            const badPlayer = {
                name: '',
                number: 'not-a-number',
                position: 'INVALID'
            };

            const res = await chai.request(app)
                .post('/players')
                .send(badPlayer);

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('errors');
        });
    });

    describe('PUT /players/:id', () => {
        it('should update an existing player', async () => {
            const update = {
                weight: 240,
                college: 'Updated College'
            };

            const res = await chai.request(app)
                .put('/players/1')
                .send(update);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('id', 1);
            expect(res.body).to.have.property('weight', update.weight);
            expect(res.body).to.have.property('college', update.college);
        });

        it('should fail when no updatable fields are provided', async () => {
            const res = await chai.request(app)
                .put('/players/1')
                .send({});

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('error');
        });

        it('should return 404 when updating non-existing player', async () => {
            const res = await chai.request(app)
                .put('/players/999999')
                .send({ weight: 210 });

            expect(res).to.have.status(404);
            expect(res.body).to.have.property('error');
        });
    });

    describe('DELETE /players/:id', () => {
        it('should delete an existing player', async () => {
            const res = await chai.request(app)
                .delete('/players/9');

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('message', 'Player deleted');
            expect(res.body).to.have.property('player');
            expect(res.body.player).to.have.property('id', 9);
        });
    });
});