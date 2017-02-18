class ParticleEmitter {

    constructor(map) {
        this.map = map;
        this.lines = [];
        this.life = 6;
    }

    emit(idx, num) {
        const scale = this.map.getScale();
        const line = this.lines[idx];
        const from = line.from,
            to = line.to,
            dx = from.x - to.x,
            dy = from.y - to.y,
            dsq = dx * dx + dy * dy,
            d = Math.sqrt(dsq);
        const nx = -dx / d,
            ny = dy / d;
        // decides angle of the particle ejection area
        const angle = 5;
        for (let i = 0; i < num; i++) {
            let speed = 20;
            if (i % 2 === 0) {
                speed *= 2;
            } else if (i % 5 === 0) {
                speed *= 3;
            }
            let vx = scale * (angle * (Math.random() - 0.5) + nx * speed);
            let vy = scale * (angle * (Math.random() - 0.5) + ny * speed);
            line.emit(vx, vy, this.life);
        }
        return this;
    }

    /**
     * Add a particle line
     * @param  {Object} config config
     * @param  {Object} config.count num of particles
     * @param  {maptalks.Coordinate} config.from start of the line
     * @param  {maptalks.Coordinate} config.to end of the line
     * @return {Object[]} particles
     */
    add(config) {
        const map = this.map;
        const maxZoom = map.getMaxZoom();
        const scale = map.getScale();
        const count = config['count'] || 1000;

        const line = new ParticleLine({
          'from'    : map.coordinateToPoint(new maptalks.Coordinate(config['from']), maxZoom),
          'to'      : map.coordinateToPoint(new maptalks.Coordinate(config['to']), maxZoom),
          'count'   : count,
          'scale'   : scale,
          'attractors' : config['attractors'],
          'color'   : config['color']
        });

        this.lines.push(line);
    }

    getParticles(t) {
        const particles = [];
        this.lines.forEach(l => {
            const lp = l.getParticles(t);
            if (lp) {
                particles.push.apply(particles, lp);
            }

        });
        return particles;
    }

    drawParticles(t) {
        const map = this.map;
        var layer = map.getLayer('particles');
        // update particles
        const particles = this.getParticles(t);
        if (!layer) {
            layer = this.createThreeLayer(particles);
            layer.addTo(map);
            layer.bringToBack();
        } else {
            if (map.isZooming() || map.isMoving() || !particles.length) {
              return;
            }
            layer.redraw();
        }
    }

    /**
    * Create a ThreeLayer to draw particles
     * @return {maptalks.ThreeLayer}
     */
    createThreeLayer(particles) {
        const life = this.life;
        var inited = false;
        var layer = new maptalks.ThreeLayer('particles', {
            renderWhenPanning : false,
            // debugOutline : true,
            glOptions : {
                depth : false
            }
        });

        const count = particles.length;

        layer.prepareToDraw = function(gl, scene, camera) {
          var center = layer.coordinateToVector3(map.getCenter());
          var line = new THREE.Geometry();
          line.colors = [];
          for (var i = 0; i < count; i++) {
            line.vertices.push(new THREE.Vector3(0, 0, 0));
            line.vertices.push(new THREE.Vector3(0, 0, 0));
            line.colors.push(new THREE.Color(0xffffff));
            line.colors.push(new THREE.Color(0xffffff));
          }
          var lineMaterial = new THREE.LineBasicMaterial({
            transparent: true,
            opacity: 1,
            vertexColors: true,
            blending: THREE.AdditiveBlending
          });
          var ln = new THREE.Line(line, lineMaterial, THREE.LinePieces);
          scene.add(ln);

          var points = new THREE.Geometry();
          points.colors = [];
          for (var i = 0; i < count; i++) {
              points.vertices.push(new THREE.Vector3(center.x, center.y, 0));
              points.colors.push(new THREE.Color(0xffffff));
          }
          var material = new THREE.PointsMaterial({
              sizeAttenuation : false,
              size: 12,
              transparent: true,
              opacity: 0.2,
              vertexColors: true,
              blending: THREE.AdditiveBlending
          });

          var cloud = new THREE.Points(points, material);
          scene.add(cloud);

          return [points, line];
        };

        layer.draw = function(gl, scene, camera, points, line) {
          const center = layer.coordinateToVector3(map.getCenter());
          for (let i = 0; i < particles.length; i++) {
            let i2 = i * 2;

            if (!inited && i === 0) {
                //FIXME, ensure the point cloud is painted.
                // The cloud won't display if painted outside screen at the beginning.
                points.vertices[i].x = center.x;
                points.vertices[i].y = center.y;
                line.vertices[i2 + 1].x = center.x;
                line.vertices[i2 + 1].y = center.y;
                line.vertices[i2].x = center.x;
                line.vertices[i2].y = center.y;
                inited = true;
                continue;
            }
            if (particles[i].life == -1) {
                points.vertices[i].x = points.vertices[i].y = 0;
                line.vertices[i2].x = line.vertices[i2].y = 0;
                line.vertices[i2 + 1].x = line.vertices[i2 + 1].y = 0;
                points.colors[i].r = points.colors[i].g = points.colors[i].b = 0;
                line.colors[i2].r = line.colors[i2].g = line.colors[i2].b = 0;
                line.colors[i2 + 1].r = line.colors[i2 + 1].g = line.colors[i2 + 1].b = 0;
                continue;
            }
            points.vertices[i].x = particles[i].x;
            points.vertices[i].y = particles[i].y;
            points.colors[i].r = particles[i].color.r * Math.pow(particles[i].life / life, 3) * 0.8;
            points.colors[i].g = particles[i].color.g * Math.pow(particles[i].life / life, 4) * 0.8;
            points.colors[i].b = particles[i].color.b * Math.pow(particles[i].life / life, 1) * 0.8;

            //FIXME line's vertex will be [0, 0] occasionally, reason unknown, this is the fix.
            if (line.vertices[i2].x === 0 || line.vertices[i2].y === 0) {
                line.vertices[i2].x = points.vertices[i].x;
                line.vertices[i2].y = points.vertices[i].y;
            }

            line.vertices[i2 + 1].x = line.vertices[i2].x;
            line.vertices[i2 + 1].y = line.vertices[i2].y;
            line.vertices[i2].x = points.vertices[i].x;
            line.vertices[i2].y = points.vertices[i].y;

            if (particles[i].life < life) {
                line.colors[i2 + 1].r = line.colors[i2].r;
                line.colors[i2 + 1].g = line.colors[i2].g;
                line.colors[i2 + 1].b = line.colors[i2].b;
                line.colors[i2].r = points.colors[i].r;
                line.colors[i2].g = points.colors[i].g;
                line.colors[i2].b = points.colors[i].b;
            }
          }

          points.verticesNeedUpdate = true;
          points.colorsNeedUpdate = true;
          line.verticesNeedUpdate = true;
          line.colorsNeedUpdate = true;
        };

        layer.clearBuffer = function () {
            const buffer = this._getRenderer().buffer;
            if (buffer) {
               buffer.getContext('2d').clearRect(0, 0, buffer.width, buffer.height);
            }
        }

        layer.onZoomStart = layer.onZoomEnd = layer.onMoveStart = layer.onMoveEnd = function (param) {
            this.clearBuffer();
        }


        layer.doubleBuffer = function(buffer, gl) {
            if (map.isZooming() || map.isMoving()) {
                buffer.clearRect(0, 0, buffer.canvas.width, buffer.canvas.height);
                return;
            }
            buffer.globalCompositeOperation = 'destination-out';
            buffer.fillStyle = 'rgba(0, 0, 0, 0.3)';
            buffer.fillRect(0, 0, buffer.canvas.width, buffer.canvas.height);
            buffer.globalCompositeOperation = "lighter";
        }

        return layer;
    }
}

/**
 * A class to emit particles
 */
class ParticleLine {

    constructor(options) {
        this.count = options['count'];
        this.from = options['from'];
        this.to = options['to'];
        this.attractors = options['attractors'];
        this.scale = options['scale'];
        const MIN = 50 * this.scale;
        this.MINSQ = MIN * MIN;
        this.empty = [];
        this.color = options['color'];
        this._init();
    }

    addAttractor(attractor) {
        this.attractors.push(attractor);
    }

    getParticles(progress) {
        if (progress === undefined || progress === null) {
            return null;
        }
        if (!this._prevTime) {
            this._prevTime = progress;
        }
        const t = (progress - this._prevTime) / 100;
        this._prevTime = progress;
        var particles = this.particles;
        if (t === 0) {
            return particles;
        }
        var live = false;
        const attractors = this.attractors;
        for (let i = 0; i < this.count; i++) {
            if (particles[i].life === -1) continue;
            live = true;
            if (particles[i].life - particles[i].lifesp <= 0) {
                particles[i].x = particles[i].y = particles[i].vx = particles[i].vy = particles[i].life = particles[i].lifesp = 0;
                particles[i].life = -1;
                this.empty.push(i);
                continue;
            }

            for (let j = 0; j < attractors.length; j++) {
                this._attract(particles[i], attractors[j], t, 1);
            }

            /*if (particles[i].nrepelled) {
                for (let j = 0; j < attractors.length; j++) {
                    if (particles[i].nrepelled.indexOf(j) >= 0) {
                        continue;
                    }
                    this._attract(particles[i], attractors[j], t, -0.02);
                }
            }*/
            particles[i].x += particles[i].vx * (t + particles[i].glitch);
            particles[i].y -= particles[i].vy * (t + particles[i].glitch);
            particles[i].glitch = 0;

            particles[i].life -= particles[i].lifesp;
        }
        if (!live) {
            return false;
        }
        return particles;
    }

    emit(vx, vy, life = 1, lifesp = 0.03, multiplier = 0) {
        if (this.empty.length === 0) return;
        var p = this.particles[this.empty.pop()];
        p.life = life;
        p.lifesp = lifesp;
        p.x = this.from.x;
        p.y = this.from.y;
        p.vx = vx;
        p.vy = vy;
        p.mult = multiplier;
        // p.nrepelled = p.attracted;
        p.color = this.color || { r : 1, g : 1, b : 1 };
    }

    /**
     * Initialize the particles
     */
    _init() {
        if (!this.attractors) {
            this.attractors = [
                {
                    x : this.to.x,
                    y : this.to.y,
                    disabled : false,
                    s : 100 * this.scale
                }
            ];
        }
        this.particles = [];
        for (let i = 0; i < this.count; i++) {
            this.particles.push({
                x : 0,
                y : 0,
                vx : 0,
                vy : 0,
                life : 0,
                // life spent
                lifesp : 0,
                mult : 0,
                glitch: 0,
                nrepelled : [],
                color: {
                    r: 1,
                    g: 1,
                    b: 1
                }
            });
            this.empty.push(i);
        }

    }

    /**
     * @param  {Object} p particle
     * @param  {Object} a attractor
     * @param  {Number} t deltaT
     * @param  {Number} m force multiplier
     */
    _attract(p, a, t, m) {
        if (!a || a.disabled) return;

        var dx = a.x - p.x;
        var dy = a.y - p.y;
        var dsq = dx * dx + dy * dy;
        dsq = dsq < this.MINSQ ? this.MINSQ : dsq;
        var d = Math.sqrt(dsq);

        var forceT = t * (600 * this.scale) * a.s / dsq * m * (p.mult ? p.mult : 1);
        var vvx = forceT * dx / d * this.scale;
        var vvy = forceT * dy / d * this.scale;
        p.vx += vvx;
        p.vy -= vvy;
        //fx / force = dx / dsq;
        //

    }
}
