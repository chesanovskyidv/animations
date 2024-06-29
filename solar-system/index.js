(function () {
  'use strict';

  const FPS = 60;
  const STARTS_COUNT = 1000;

  const canvas = document.getElementById('space');
  const ctx = canvas.getContext('2d');

  let stars = [], sun, planets = [];

  /**
   * Resize canvas to full screen.
   */
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    stars = createStars();
  }

  document.addEventListener('DOMContentLoaded', resizeCanvas);
  window.addEventListener('resize', resizeCanvas);

  /**
   * Point class constructor.
   *
   * @param {number} x Coordinate on canvas by x-axis
   * @param {number} y Coordinate on canvas by y-axis
   * @constructor
   */
  const Point = function (x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Size class constructor.
   *
   * @param {number} width Width of the object
   * @param {number} height Height of the object
   * @constructor
   */
  const Size = function (width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Angle class constructor.
   *
   * @param {number} degree
   * @constructor
   */
  const Angle = function (degree) {
    this.degree = degree;

    this.toRadians = function () {
      return this.degree * Math.PI / 180;
    }
  }
  /**
   * Get rotation delta for 1 tick.
   *
   * @param {Time} turnoverTime Complete turnover time
   * @returns {number} Rotation delta in degrees
   */
  Angle.getRotationDelta = function (turnoverTime) {
    return 360 / (turnoverTime.seconds * FPS);
  }

  /**
   * Time class constructor.
   *
   * @param {number} seconds Time in seconds
   * @constructor
   */
  const Time = function (seconds) {
    this.seconds = seconds;
  }

  /**
   * Star class constructor.
   *
   * @constructor
   */
  const Star = function () {
    const colors = ['#ffffff', '#ffe9c4', '#d4fbff'];
    const radii = [0.3, 0.4, 0.4, 0.5];

    this.center = new Point(Math.random() * canvas.width, Math.random() * canvas.height);
    this.radius = radii[Math.floor(Math.random() * radii.length)];
    this.color = colors[Math.floor(Math.random() * colors.length)];

    // Make some stars bigger and brighter
    if (Math.random() > 0.99) {
      this.color = '#ffff00';
      this.radius = 0.8;
    }

    /**
     * Move star to the next position.
     */
    this.move = function () {
      if (this.center.x < 0 || this.center.x > canvas.width || this.center.y < 0 || this.center.y > canvas.height) {
        return this.reset();
      }

      const center = new Point(canvas.width / 2, canvas.height / 2);

      this.center = new Point(
        this.center.x + (this.center.x - center.x) / 2500,
        this.center.y + (this.center.y - center.y) / 2500
      );
    }

    /**
     * Reset star position.
     */
    this.reset = function () {
      this.center = new Point(Math.random() * canvas.width, Math.random() * canvas.height);
    }

    /**
     * Draw star on canvas.
     */
    this.draw = function () {
      ctx.beginPath();
      ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  /**
   * Create stars array.
   *
   * @returns {Star[]} Array of stars
   */
  function createStars() {
    const stars = [];

    for (let i = 0; i < STARTS_COUNT; i++) {
      stars.push(new Star());
    }

    return stars;
  }

  /**
   * Draw stars on canvas.
   */
  function drawStars() {
    stars.forEach(function (star) {
      star.move();
      star.draw();
    });
  }

  /**
   * Astronomical object class constructor.
   *
   * @param {string} src Path to the image
   * @param {Size} size Size of the object
   * @param {Object} [hooks] Callback functions
   * @param {Function} [hooks.preDraw] Callback function before drawing the object
   * @constructor
   */
  const AstronomicalObject = function (src, size, hooks = {}) {
    this.image = new Image(size.width, size.height);
    this.image.src = src;
    this.hooks = hooks;

    /**
     * Call hook function.
     *
     * @param {string} hookName Name of the hook
     * @param {any} args Arguments for the hook function
     * @private
     */
    this._callHook = function (hookName, ...args) {
      if (typeof this.hooks[hookName] === 'function') {
        return this.hooks[hookName](...args);
      }
    }

    /**
     * Get image of the astronomical object.
     *
     * @param {Point} point Center of the object
     * @param {Angle} angle Rotation angle
     * @returns {HTMLImageElement|*}
     * @private
     */
    this._getImage = function (point, angle) {
      const image = this._callHook('getImage', this.image, point, angle);

      if (image) {
        return image;
      }

      return this.image;
    }

    /**
     * Draw astronomical object on canvas.
     *
     * @param {Point} point Center of the object
     * @param {Angle} angle Rotation angle
     * @private
     */
    this._draw = function (point, angle) {
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(angle.toRadians());

      this._callHook('preDraw', ctx);
      ctx.drawImage(this._getImage(point, angle), -this.image.width / 2, -this.image.height / 2, this.image.width, this.image.height);

      ctx.restore();
    }

    /**
     * Draw astronomical object on canvas.
     * It waits for the image to be loaded.
     *
     * @param {Point} point Center of the object
     * @param {Angle} angle Rotation angle
     */
    this.draw = function (point, angle) {
      if (this.image.complete) {
        this._draw(point, angle);
      } else {
        this.image.onload = function () {
          this._draw.call(this, point, angle);
        }.bind(this);
      }
    }
  }

  /**
   * Astronomical rotated object class constructor.
   * It rotates around its center.
   *
   * @param {string} src Path to the image
   * @param {Size} size Size of the object
   * @param {Time} turnoverTime Complete turnover time
   * @param {Object} [hooks] Callback functions
   * @param {Function} [hooks.preDraw] Callback function before drawing the object
   * @constructor
   */
  const AstronomicalRotatedObject = function (src, size, turnoverTime, hooks = {}) {
    this.astronomicalObject = new AstronomicalObject(src, size, hooks);

    const delta = Angle.getRotationDelta(turnoverTime);
    this.angle = new Angle(0);

    /**
     * Draw astronomical object on canvas.
     *
     * @param {Point} point Center of the object
     */
    this.draw = function (point) {
      this.angle = new Angle((this.angle.degree + delta) % 360);
      this.astronomicalObject.draw(point, this.angle);
    }
  }

  /**
   * Orbit class constructor.
   *
   * @param {Point} center Center of the orbit
   * @param {number} radius Radius of the orbit
   * @param {Time} turnoverTime Complete turnover time
   * @param {number} startAngle Start angle of the orbit
   * @constructor
   */
  const Orbit = function (center, radius, turnoverTime, startAngle = 0) {
    this.center = center;
    this.radius = radius;

    const delta = Angle.getRotationDelta(turnoverTime);
    this.angle = new Angle(startAngle);

    /**
     * Get point on the orbit.
     *
     * @returns {Point} Point on the orbit
     */
    this.getPoint = function () {
      const radianAngle = this.angle.toRadians();

      return new Point(
        this.center.x + this.radius * Math.cos(radianAngle),
        this.center.y + this.radius * Math.sin(radianAngle)
      );
    }

    /**
     * Set center of the orbit.
     * It used when the center of the orbit is changed like in the case of planets.
     *
     * @param {Point} center Center of the orbit
     */
    this.setCenter = function (center) {
      this.center = center;
    }

    /**
     * Get next point on the orbit.
     *
     * @returns {Point} Next point on the orbit
     */
    this.getNextPoint = function () {
      this.angle = new Angle((this.angle.degree + delta) % 360);

      return this.getPoint();
    }

    /**
     * Draw the orbit on canvas.
     */
    this.draw = function () {
      // Calculate start and end angles
      const arcAngle = new Angle(120);
      const startAngleRadians = this.angle.toRadians();
      const endAngle = new Angle(this.angle.degree - arcAngle.degree);
      const endAngleRadians = endAngle.toRadians();

      // Prepare gradient
      const gradient = ctx.createLinearGradient(
        this.center.x + this.radius * Math.cos(startAngleRadians),
        this.center.y + this.radius * Math.sin(startAngleRadians),
        this.center.x + this.radius * Math.cos(endAngleRadians),
        this.center.y + this.radius * Math.sin(endAngleRadians)
      );
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      // Draw an orbit
      ctx.beginPath();
      ctx.arc(this.center.x, this.center.y, this.radius, startAngleRadians, endAngleRadians, true);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.closePath();
    }
  }

  /**
   * Sun class constructor
   *
   * @param {Point} center Center of the sun coordinates
   * @param {Time} turnoverTime Complete turnover time
   * @constructor
   */
  const Sun = function (center, turnoverTime) {
    this.center = center;
    this.astronomicalObject = new AstronomicalRotatedObject('images/sun.png', new Size(80, 80), turnoverTime, {
      preDraw: function (ctx) {
        ctx.shadowInset = true;
        ctx.shadowBlur = 25;
        ctx.shadowColor = "#fff";
      }
    });

    /**
     * Draw sun on canvas.
     */
    this.draw = function () {
      this.astronomicalObject.draw(this.center);
    }
  }

  /**
   * Planet class constructor.
   *
   * @param {string} src Path to the image
   * @param {Size} size Size of the planet
   * @param {Time} turnoverTime Complete turnover time
   * @param {Orbit} orbit Orbit of the planet
   * @param {Function} [afterInitialization] Callback function after initialization
   * @constructor
   */
  const Planet = function (src, size, turnoverTime, orbit, afterInitialization = null) {

    const offScreenCanvas = document.createElement('canvas');
    const offScreenCtx = offScreenCanvas.getContext('2d');

    this.astronomicalObject = new AstronomicalRotatedObject(src, size, turnoverTime, {
      getImage: function (image, point, planetAngle) {
        offScreenCtx.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);

        // Create a temporary canvas to work with the planet
        offScreenCanvas.width = image.width;
        offScreenCanvas.height = image.height;

        const planetCenter = new Point(0, 0);
        const distanceFromSunToPlanet = orbit.radius;
        const planetToSunAngle = new Angle(180 + orbit.angle.degree - planetAngle.degree);
        const sunCenter = new Point(
          planetCenter.x + distanceFromSunToPlanet * Math.cos(planetToSunAngle.toRadians()),
          planetCenter.y + distanceFromSunToPlanet * Math.sin(planetToSunAngle.toRadians())
        );

        const planetRadius = Math.max(image.width, image.height) / 2;
        const innerRadius = distanceFromSunToPlanet - planetRadius;
        const outerRadius = distanceFromSunToPlanet + planetRadius;

        offScreenCtx.save();
        // Draw the planet on the temporary canvas
        offScreenCtx.translate(offScreenCanvas.width / 2, offScreenCanvas.height / 2);
        offScreenCtx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);

        // Create a gradient for the sun light
        const gradient = ctx.createRadialGradient(sunCenter.x, sunCenter.y, innerRadius, sunCenter.x, sunCenter.y, outerRadius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.6)');
        gradient.addColorStop(0.9, 'rgba(0, 0, 0, 0.8)');

        // Draw sun light on the temporary canvas
        offScreenCtx.globalCompositeOperation = 'source-atop';
        offScreenCtx.beginPath();
        offScreenCtx.arc(sunCenter.x, sunCenter.y, innerRadius, 0, 2 * Math.PI);
        offScreenCtx.arc(sunCenter.x, sunCenter.y, outerRadius, 0, 2 * Math.PI, true);
        offScreenCtx.fillStyle = gradient;
        offScreenCtx.fill();

        offScreenCtx.restore();

        return offScreenCanvas;
      },
    });
    this.orbit = orbit;
    this.center = this.orbit.getPoint();
    this.rings = [];
    this.satellites = [];

    if (typeof afterInitialization === 'function') {
      afterInitialization(this);
    }

    /**
     * Move planet to the next position.
     */
    this.move = function () {
      this.center = this.orbit.getNextPoint();
    }

    /**
     * Draw planet on canvas.
     */
    this.draw = function () {
      this.orbit.draw();
      this.astronomicalObject.draw(this.center);
      this.rings.forEach(function (ring) {
        ring.move();
        ring.draw();
      });
      this.satellites.forEach(function (satellite) {
        satellite.move();
        satellite.draw();
      });
    }
  }

  /**
   * Draw planets on canvas.
   */
  function drawPlanets() {
    planets.forEach(function (planet) {
      planet.move();
      planet.draw();
    });
  }

  /**
   * Ring class constructor.
   *
   * @param {Planet} planet Planet which the ring belongs to
   * @param {number} innerRadius Inner radius of the ring
   * @param {number} outerRadius Outer radius of the ring
   * @param {string} color Color of the ring
   * @param {Time} turnoverTime Complete turnover time
   * @constructor
   */
  const Ring = function (planet, innerRadius, outerRadius, color, turnoverTime) {
    this.planet = planet;
    this.center = planet.center;
    this.innerRadius = innerRadius;
    this.outerRadius = outerRadius;
    this.color = color;
    this.angle = new Angle(0);

    const delta = Angle.getRotationDelta(turnoverTime);

    /**
     * Move ring to the next position.
     */
    this.move = function () {
      this.center = this.planet.center;
      this.angle = new Angle((this.angle.degree + delta) % 360);
    }

    /**
     * Draw ring on canvas.
     */
    this.draw = function () {
      const angleRadians = this.angle.toRadians();

      ctx.save();
      ctx.translate(this.center.x, this.center.y);
      ctx.rotate(angleRadians);
      ctx.transform(1, 0.3, 0, 1, 0, 0);

      ctx.beginPath();
      ctx.arc(0, 0, this.outerRadius, 0, 2 * Math.PI);
      ctx.arc(0, 0, this.innerRadius, 0, 2 * Math.PI, true);
      ctx.fillStyle = this.color;
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Satellite class constructor.
   *
   * @param {string} src Path to the image
   * @param {Size} size Size of the satellite
   * @param {Time} turnoverTime Complete turnover time
   * @param {Planet} planet Planet which the satellite belongs to
   * @param {Orbit} orbit Orbit of the satellite
   * @constructor
   */
  const Satellite = function (src, size, turnoverTime, planet, orbit) {
    this.astronomicalObject = new AstronomicalRotatedObject(src, size, turnoverTime);
    this.planet = planet;
    this.orbit = orbit;
    this.center = this.orbit.getPoint();

    /**
     * Move satellite to the next position.
     */
    this.move = function () {
      this.orbit.setCenter(this.planet.center);
      this.center = this.orbit.getNextPoint();
    }

    /**
     * Draw satellite on canvas.
     */
    this.draw = function () {
      this.astronomicalObject.draw(this.center);
      this.orbit.draw();
    }
  }

  /**
   * Initialize the animation.
   */
  function init() {
    const center = new Point(canvas.width / 2, canvas.height / 2);

    stars = createStars();
    sun = new Sun(center, new Time(30));
    planets = [
      new Planet('images/mercury.png', new Size(10, 10), new Time(6), new Orbit(center, 60, new Time(8.8))),
      new Planet('images/venus.png', new Size(10, 10), new Time(25), new Orbit(center, 80, new Time(22.5))),
      new Planet('images/earth.png', new Size(30, 30), new Time(6.5), new Orbit(center, 120, new Time(36.5)), function (planet) {
        planet.satellites = [
          new Satellite('images/moon.png', new Size(8, 8), new Time(2.73), planet, new Orbit(planet.center, 20, new Time(2.73))),
        ];
      }),
      new Planet('images/mars.png', new Size(18, 18), new Time(8), new Orbit(center, 160, new Time(42))),
      new Planet('images/jupiter.png', new Size(27, 27), new Time(24), new Orbit(center, 200, new Time(57))),
      new Planet('images/saturn.png', new Size(27, 27), new Time(28), new Orbit(center, 240, new Time(62)), function (planet) {
        planet.rings = [
          new Ring(planet, 17, 20, 'rgba(200, 200, 200, 0.5)', new Time(16)),
        ];
      }),
      new Planet('images/uranus.png', new Size(24, 24), new Time(34), new Orbit(center, 280, new Time(74))),
      new Planet('images/neptune.png', new Size(24, 24), new Time(40), new Orbit(center, 320, new Time(81))),
      new Planet('images/pluto.png', new Size(24, 24), new Time(44), new Orbit(center, 360, new Time(90))),
    ];

    draw();
  }

  /**
   * Draw animation.
   * It is called recursively on each frame.
   */
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawStars(stars);
    sun.draw();
    drawPlanets(planets);

    requestAnimationFrame(draw);
  }

  document.addEventListener('DOMContentLoaded', init);
})()