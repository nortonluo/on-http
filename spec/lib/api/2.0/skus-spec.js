// Copyright 2016, EMC, Inc.
/* jshint node:true */

'use strict';

describe('Http.Api.Skus.2.0', function() {
    var configuration;
    var waterline;
    var ObmService;
    var workflowApiService;
    var nodeApiService;
    var lookupService;
    var Promise;
    var Constants;
    var Errors;
    var skuApiService;


    before('start HTTP server', function () {
        this.timeout(5000);
        return helper.startServer([
        ]).then(function() {
            waterline = helper.injector.get('Services.Waterline');
            sinon.stub(waterline.nodes);
            sinon.stub(waterline.skus);
            workflowApiService = helper.injector.get('Http.Services.Api.Workflows');
            nodeApiService = helper.injector.get('Http.Services.Api.Nodes');
            sinon.stub(nodeApiService);
            skuApiService = helper.injector.get('Http.Services.SkuPack');
            Promise = helper.injector.get('Promise');
            Constants = helper.injector.get('Constants');
            Errors = helper.injector.get('Errors');
        });

    });

    beforeEach('reset stubs', function () {
        function resetStubs(obj) {
            _(obj).methods().forEach(function (method) {
                if (obj[method] && obj[method].reset) {
                    obj[method].reset();
                }
            }).value();
        }
        resetStubs(waterline.nodes);
        resetStubs(waterline.skus);
        resetStubs(workflowApiService);

    });

    after('stop HTTP server', function () {
        return helper.stopServer();
    });

    var node = {
        id: '1234abcd1234abcd1234abcd',
        name: 'sku test node',
        type: 'compute',
        obmSettings: [
            {
                service: 'ipmi-obm-service',
                config: {
                    host: '1.2.3.4',
                    user: 'myuser',
                    password: 'mypass'
                }
            }
        ],
        autoDiscover: "false",
        identifiers: [],
        createdAt: '010101',
        updatedAt: '010101',
        tags: [],
        sku: '0987'
    };

    var input = {
        name: 'my test sku',
        rules: [
            {
                path: 'dmi.dmi.base_board.manufacturer',
                contains: 'Intel'
            },
            {
                path: 'dmi.memory.total',
                equals: '32946864kB'
            }
        ],
        discoveryGraphName: 'TestGraph.Dummy',
        discoveryGraphOptions: { test: 1 },
        id: '0987'
    };

    beforeEach(function() {
        sinon.stub(skuApiService, 'getSkus');
        sinon.stub(skuApiService, 'postSku');
        sinon.stub(skuApiService, 'getSkusById');
        sinon.stub(skuApiService, 'upsertSku');
        sinon.stub(skuApiService, 'patchSku');
        sinon.stub(skuApiService, 'getNodesSkusById');
        sinon.stub(skuApiService, 'regenerateSkus');
        sinon.stub(skuApiService, 'deleteSkuById');
        sinon.stub(workflowApiService, 'createAndRunGraph');
    });

    afterEach(function() {
        skuApiService.getSkus.restore();
        skuApiService.postSku.restore();
        skuApiService.getSkusById.restore();
        skuApiService.upsertSku.restore();
        skuApiService.patchSku.restore();
        skuApiService.regenerateSkus.restore();
        skuApiService.getNodesSkusById.restore();
        skuApiService.deleteSkuById.restore();
        workflowApiService.createAndRunGraph.restore();
    });





    it('should return an empty array from GET /skus', function () {
        skuApiService.getSkus.resolves([]);
        return helper.request().get('/api/2.0/skus')
            .expect('Content-Type', /^application\/json/)
            .expect(200, []);
    });

    describe('created SKU', function () {
        var sku;

        it('should create a sku', function(){
            skuApiService.postSku.resolves(input);
            return helper.request().post('/api/2.0/skus')
                .send(input)
                .expect('Content-Type', /^application\/json/)
                .expect(201)
                .then(function (req) {
                    sku = req.body;
                    expect(sku).to.have.property('name').that.equals(input.name);
                    expect(sku).to.have.property('rules').that.deep.equals(input.rules);
                    expect(sku).to.have.property('discoveryGraphName')
                        .that.equals(input.discoveryGraphName);
                    expect(sku).to.have.property('discoveryGraphOptions')
                        .that.deep.equals(input.discoveryGraphOptions);
                });
        });

        it('should contain the new sku in GET /skus', function () {
            skuApiService.getSkus.resolves([input]);
            return helper.request().get('/api/2.0/skus')
            .expect('Content-Type', /^application\/json/)
            .expect(200, [sku]);
        });


        it('should return the same sku from GET /skus/:id', function () {
            skuApiService.getSkusById.resolves(input);
            return helper.request().get('/api/2.0/skus/' + sku.id)
            .expect('Content-Type', /^application\/json/)
            .expect(200)
            .then(function (res) {
                    var checkSku = res.body;
                    console.log("Printing checkSku hereeeeeeeee");
                    console.log(checkSku);
                    expect(checkSku).to.have.property('name').that.equals(input.name);
                });
        });

        it('should 200 reputting the same sku', function() {
            skuApiService.upsertSku.resolves(input);
            return helper.request().put('/api/2.0/skus')
            .send(input)
            .expect(200);
        });

        describe('PATCH /skus/:id', function () {
            var updated;
            var updated_input = {
                name: 'updated sku name',
                rules: [
                    {
                        path: 'dmi.dmi.base_board.manufacturer',
                        contains: 'Intel'
                    },
                    {
                        path: 'dmi.memory.total',
                        equals: '32946864kB'
                    }
                ],
                discoveryGraphName: 'TestGraph.Dummy',
                discoveryGraphOptions: {test: 1},
                id: '0987'
            };

            beforeEach('reset createAndRunGraph stub', function () {
                workflowApiService.createAndRunGraph.reset();
            });

            it('should Patch updated name to the sku', function () {
                sku.name = 'updated sku name';
                skuApiService.patchSku.resolves(updated_input);
                return helper.request().patch('/api/2.0/skus/0987')
                    .send(input)
                    .expect('Content-Type', /^application\/json/)
                    .expect(200)
                    .then(function (res) {
                        updated = res.body;
                        console.log(updated);
                        expect(updated).to.have.property('name').that.equals(sku.name);
                        expect(updated).to.have.property('rules').that.deep.equals(sku.rules);
                    });
            });

        });
        describe('GET /skus/:id/nodes', function () {
            it('should contain the node', function () {
                skuApiService.getNodesSkusById.resolves([node]);
                return helper.request().get('/api/2.0/skus/' + sku.id + '/nodes')
                    .expect('Content-Type', /^application\/json/)
                    .expect(200)
                    .expect(function (res) {
                        expect(res.body).to.be.an.instanceof(Array);
                        expect(res.body).to.have.length(1);
                        expect(res.body[0]).to.have.property('id').that.equals(node.id);
                    });
            });
        });

        describe('DELETE /skus/:id', function () {

            beforeEach('DELETE /skus/:id', function () {
                skuApiService.deleteSkuById.resolves();
                return helper.request().delete('/api/2.0/skus/' + sku.id)
                    .expect(200)
            })

            it('should 404 with GET /skus/:id ', function () {
                skuApiService.getSkusById.rejects(new Errors.NotFoundError('Not Found'));
                return helper.request().get('/api/2.0/skus/0987')
                    .expect(404)
            });

            it('should return an empty array from GET /skus', function () {
                skuApiService.getSkus.resolves([]);
                return helper.request().get('/api/2.0/skus')
                .expect('Content-Type', /^application\/json/)
                .expect(200, []);
            });
        });

        describe('PUT /skus/pack', function () {
            var skuService;

            beforeEach('setup', function () {
                skuService = helper.injector.get('Http.Services.SkuPack');
                sinon.stub(skuService, 'installPack');
                sinon.stub(skuService, 'registerPack');
                skuService.installPack.resolves(['filename', 'contents']);
                skuService.registerPack.resolves();
            });

            beforeEach('reset createAndRunGraph stub', function () {
                workflowApiService.createAndRunGraph.resolves();
            });

            afterEach('teardown', function () {
                skuService.installPack.restore();
                skuService.registerPack.restore();
            });

            it('should process a .tar.gz file', function (done) {
                var skus = helper.injector.get('Http.Services.SkuPack');
                var fs = helper.injector.get('fs');
                var req = fs.createReadStream('spec/lib/services/sku-static/pack.tar.gz');
                var res = {};
                req.on('open', function() {
                    req.headers = {
                        'content-type': 'application/x-www-form-urlencoded'
                    };
                    skus.skuPackHandler(req, res).then(function(obj) {
                        expect(obj.id).equals("filename");
                        done();
                    });
                });
            });
        });

    });
});

