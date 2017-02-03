describe('ThreeLayer', function () {
    var container, map;
    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '300px';
        document.body.appendChild(container);
        map = new maptalks.Map(container, {
            center : [0, 0],
            zoom : 17
        });
    });

    afterEach(function () {
        map.remove();
        maptalks.DomUtil.removeDomNode(container);
    });

    it('should display when added to map', function (done) {
        new maptalks.ThreeLayer('d').addTo(map);
        done();
    });

    /*it('should display if added again after removed', function (done) {
        var layer = new maptalks.E3Layer('g', getE3Option());
        layer.once('layerload', function () {
            expect(layer).to.be.painted();
            map.removeLayer(layer);
            layer.once('layerload', function () {
                expect(layer).to.be.painted();
                done();
            });
            map.addLayer(layer);
        });
        map.addLayer(layer);
    });

    it('should display after zooming', function (done) {
        var layer = new maptalks.E3Layer('g', getE3Option());
        layer.once('layerload', function () {
            map.on('zoomend', function () {
                expect(layer).to.be.painted();
                done();
            });
            map.zoomIn();
        });
        map.addLayer(layer);
    });


    it('should show', function (done) {
        var layer = new maptalks.E3Layer('g', getE3Option(), { visible : false });
        layer.once('layerload', function () {
            expect(layer).not.to.be.painted();
            layer.once('layerload', function () {
                expect(layer).to.be.painted();
                done();
            });
            layer.show();
        });
        map.addLayer(layer);
    });

    it('should hide', function (done) {
        var layer = new maptalks.E3Layer('g', getE3Option());
        layer.once('layerload', function () {
            expect(layer).to.be.painted();
            layer.once('hide', function () {
                expect(layer).not.to.be.painted();
                done();
            });
            layer.hide();
        });
        map.addLayer(layer);
    });

    it('should serialized with JSON', function (done) {
        var layer = new maptalks.E3Layer('g', getE3Option());
        var json = layer.toJSON();
        var copy = maptalks.Layer.fromJSON(json);
        expect(data).to.be.eql(copy.getData());
        copy.on('layerload', function () {
            expect(copy).to.be.painted();
            done();
        })
        .addTo(map);
    });

    it('should can add point', function (done) {
        var layer = new maptalks.E3Layer('g');
        layer.once('layerload', function () {
            expect(layer).not.to.be.painted();
            layer.once('layerload', function () {
                expect(layer).to.be.painted();
                done();
            });
            layer.addPoint([0, 0, 1]);
        })
        .addTo(map);
    });

    it('should can set data', function (done) {
        var layer = new maptalks.E3Layer('g');
        layer.once('layerload', function () {
            expect(layer).not.to.be.painted();
            layer.once('layerload', function () {
                expect(layer).to.be.painted();
                done();
            });
            layer.setData([[0, 0, 1]]);
        })
        .addTo(map);
    });*/
});
