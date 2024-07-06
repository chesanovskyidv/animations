(function () {
  'use strict';

  const FPS = 60;
  const STARTS_COUNT = 1000;
  const IMAGES = {
    SUN: 'images/sun.png',
    MERCURY: 'images/mercury.png',
    VENUS: 'images/venus.png',
    EARTH: 'images/earth.png',
    MARS: 'images/mars.png',
    JUPITER: 'images/jupiter.png',
    SATURN: 'images/saturn.png',
    URANUS: 'images/uranus.png',
    NEPTUNE: 'images/neptune.png',
    PLUTO: 'images/pluto.png',
    MOON: 'images/moon.png',
  }

  const canvas = document.getElementById('space');

  /**
   * Resize canvas to full screen.
   */
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  document.addEventListener('DOMContentLoaded', resizeCanvas);
  window.addEventListener('resize', resizeCanvas);

  class Point {
    /**
     * @param {number} x X coordinate on canvas.
     * @param {number} y Y coordinate on canvas.
     * @constructor
     */
    constructor(x, y) {
      /** X coordinate on canvas. */
      this.x = x;
      /** Y coordinate on canvas. */
      this.y = y;
    }
  }

  class Size {
    /**
     * @param {number} width Width in pixels.
     * @param {number} height Height in pixels.
     * @constructor
     */
    constructor(width, height) {
      /** Width in pixels. */
      this.width = width;
      /** Height in pixels. */
      this.height = height;
    }
  }

  class Angle {
    /**
     * @param {number} degree The angle in degrees.
     * @constructor
     */
    constructor(degree) {
      /** The angle in degrees. */
      this.degree = degree;
    }

    /**
     * Convert angle to radians.
     *
     * @returns {number} Angle in radians.
     */
    toRadians() {
      return this.degree * Math.PI / 180;
    }

    /**
     * New angle with added delta.
     *
     * @param {number} delta Rotation delta in degrees.
     * @returns {Angle} New angle.
     */
    addDelta(delta) {
      return new Angle((this.degree + delta) % 360);
    }

    /**
     * Get rotation delta for 1 tick.
     * It is used to calculate the rotation angle for each frame.
     *
     * @param {Time} fullRotationTime Complete turnover time.
     * @returns {number} Rotation delta in degrees.
     */
    static getRotationDelta(fullRotationTime) {
      return 360 / (fullRotationTime.seconds * FPS);
    }
  }

  class Time {
    /**
     * @param {number} seconds Time in seconds.
     * @constructor
     */
    constructor(seconds) {
      /** Time in seconds. */
      this.seconds = seconds;
    }
  }

  class Star {
    /**
     * @param {Point} center Center of the star.
     * @param {number} radius Radius of the star.
     * @param {string} color Color of the star.
     * @constructor
     */
    constructor(center, radius, color) {
      /** Center of the star. */
      this.center = center;
      /** Radius of the star. */
      this.radius = radius;
      /** Color of the star. */
      this.color = color;
    }

    /**
     * Reset star position.
     * It is to make the star appear on the other side of the canvas.
     *
     * @returns {Star} The object itself.
     */
    reset() {
      const canvas = SolarSystem.getInstance().canvas;
      this.center = new Point(Math.random() * canvas.width, Math.random() * canvas.height);

      return this;
    }

    /**
     * Move star to the next position.
     *
     * @returns {Star} The object itself.
     */
    move() {
      const solarSystem = SolarSystem.getInstance();
      const canvas = solarSystem.canvas;

      // Reset star position if it is out of the canvas.
      if (this.center.x < 0 || this.center.x > canvas.width || this.center.y < 0 || this.center.y > canvas.height) {
        return this.reset();
      }

      this.center = new Point(
        this.center.x + (this.center.x - solarSystem.center.x) / 2500,
        this.center.y + (this.center.y - solarSystem.center.y) / 2500
      );

      return this;
    }

    /**
     * Draw star on canvas.
     *
     * @param {CanvasRenderingContext2D} ctx Canvas context.
     */
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI);
      ctx.fillStyle = this.color;
      ctx.fill();
    }

    /**
     * Factory method.
     * Create a new random star.
     *
     * @returns {Star} New star.
     * @static
     */
    static create() {
      const colors = ['#ffffff', '#ffe9c4', '#d4fbff'];
      const radii = [0.3, 0.4, 0.4, 0.5];
      const canvas = SolarSystem.getInstance().canvas;

      // Make some stars bigger and brighter.
      if (Math.random() > 0.99) {
        return new Star(
          new Point(Math.random() * canvas.width, Math.random() * canvas.height),
          0.8,
          '#ffff00'
        );
      }

      return new Star(
        new Point(Math.random() * canvas.width, Math.random() * canvas.height),
        radii[Math.floor(Math.random() * radii.length)],
        colors[Math.floor(Math.random() * colors.length)]
      );
    }
  }

  /**
   * Class to draw an image on canvas.
   */
  class ImageObject {
    /**
     * @param {string} src Path to the image.
     * @param {Size} size Size of the object.
     * @constructor
     */
    constructor(src, size) {
      /** Image object. */
      this.image = new Image(size.width, size.height);
      this.image.src = src;
    }

    /**
     * Get image of the object.
     * It can be overridden in the child class.
     *
     * @param {CanvasImageSource} image Image object.
     * @returns {CanvasImageSource} Image object.
     * @private
     */
    _getImage(image) {
      return image;
    }

    /**
     * Draw image on canvas.
     *
     * @param {CanvasRenderingContext2D} ctx Canvas context.
     * @param {Point} point Center of the object.
     * @private
     */
    _draw(ctx, point) {
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.drawImage(this._getImage(this.image), -this.image.width / 2, -this.image.height / 2, this.image.width, this.image.height);
      ctx.restore();
    }

    /**
     * Smart method to draw an image on canvas.
     * It waits for the image to be loaded.
     *
     * @param {CanvasRenderingContext2D} ctx Canvas context.
     * @param {Point} point Center of the object.
     */
    draw(ctx, point) {
      // Add a callback if the image is not loaded yet.
      if ( !this.image.complete) {
        this.image.onload = () => {
          this._draw(ctx, point);
        };

        return;
      }

      this._draw(ctx, point);
    }
  }

  /**
   * Class to draw a rotatable image on canvas.
   */
  class RotatableObject extends ImageObject {
    /**
     * @param {string} src Path to the image.
     * @param {Size} size Size of the object.
     * @param {Time} fullRotationTime Complete turnover time.
     * @constructor
     */
    constructor(src, size, fullRotationTime) {
      super(src, size);
      /** Object rotation angle. */
      this.angle = new Angle(0);
      /**
       * Rotation delta in degrees for each frame.
       * @private
       */
      this._delta = Angle.getRotationDelta(fullRotationTime);
    }

    /**
     * Rotate the object for the next frame.
     *
     * @returns {RotatableObject} The object itself.
     */
    rotate() {
      this.angle = this.angle.addDelta(this._delta);

      return this;
    }

    /**
     * Draw object on canvas.
     *
     * @param {CanvasRenderingContext2D} ctx Canvas context.
     * @param {Point} point Center of the object.
     * @private
     */
    _draw(ctx, point) {
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(this.angle.toRadians());
      super._draw(ctx, new Point(0, 0));
      ctx.restore();
    }
  }

  class Sun extends RotatableObject {
    /**
     * @param {Point} center Center of the sun.
     * @param {Size} size Size of the object.
     * @param {Time} fullRotationTime Complete turnover time.
     * @constructor
     */
    constructor(center, size, fullRotationTime) {
      super(IMAGES.SUN, size, fullRotationTime);
      /** Center of the sun. */
      this.center = center;
    }

    /**
     * Draw sun on canvas.
     *
     * @param {CanvasRenderingContext2D} ctx Canvas context.
     * @param {Point} point Center of the object.
     * @private
     */
    _draw(ctx, point) {
      ctx.save();
      ctx.shadowInset = true;
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#ffffff";
      super._draw(ctx, point);
      ctx.restore();
    }

    /**
     * Draw sun on canvas.
     *
     * @param {CanvasRenderingContext2D} ctx Canvas context.
     */
    draw(ctx) {
      super.draw(ctx, this.center);
    }
  }

  class Orbit {
    /**
     * @param {Point|{center: Point}} barycenter Center of the orbit.
     * @param {number} radius Radius of the orbit.
     * @param {Time} orbitalRotationTime Complete turnover time.
     * @constructor
     */
    constructor(barycenter, radius, orbitalRotationTime) {
      /**
       * Barycenter of the orbit.
       * @private
       */
      this._center = barycenter;
      /** Radius of the orbit. */
      this.radius = radius;
      /** Angle from the center to the object on an orbit. */
      this.angle = new Angle(0);
      /**
       * Rotation delta in degrees for each frame.
       * @private
       */
      this._delta = Angle.getRotationDelta(orbitalRotationTime);
    }

    /**
     * Getter for the barycenter of the orbit.
     *
     * @returns {Point} Barycenter of the orbit.
     */
    get center() {
      if (this._center?.center instanceof Point) {
        return this._center.center;
      }

      return this._center;
    }

    /**
     * Getter for the object point on the orbit.
     *
     * @returns {Point} Point on the orbit.
     */
    get orbitalPoint() {
      return this._getOrbitalPoint();
    }

    /**
     * Get object point on the orbit.
     *
     * @returns {Point} Point on the orbit.
     */
    _getOrbitalPoint() {
      const radianAngle = this.angle.toRadians();

      return new Point(
        this.center.x + this.radius * Math.cos(radianAngle),
        this.center.y + this.radius * Math.sin(radianAngle)
      );
    }

    /**
     * Move orbit to the next position.
     *
     * @returns {Orbit} The object itself.
     */
    move() {
      this.angle = this.angle.addDelta(this._delta);

      return this;
    }

    /**
     * Draw the orbit on canvas.
     *
     * @param {CanvasRenderingContext2D} ctx Canvas context.
     */
    draw(ctx) {
      // Calculate start and end angles.
      const arcAngle = new Angle(120);
      const startAngleRadians = this.angle.toRadians();
      const endAngle = new Angle(this.angle.degree - arcAngle.degree);
      const endAngleRadians = endAngle.toRadians();

      // Prepare gradient.
      const gradient = ctx.createLinearGradient(
        this.center.x + this.radius * Math.cos(startAngleRadians),
        this.center.y + this.radius * Math.sin(startAngleRadians),
        this.center.x + this.radius * Math.cos(endAngleRadians),
        this.center.y + this.radius * Math.sin(endAngleRadians)
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      // Draw an orbit.
      ctx.beginPath();
      ctx.arc(this.center.x, this.center.y, this.radius, startAngleRadians, endAngleRadians, true);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.closePath();
    }
  }

  class Planet extends RotatableObject {
    /**
     * @param {string} src Path to the image.
     * @param {Size} size Size of the object.
     * @param {Time} fullRotationTime Complete turnover time.
     * @param {Orbit} orbit Orbit of the planet.
     * @constructor
     */
    constructor(src, size, fullRotationTime, orbit) {
      super(src, size, fullRotationTime);
      /** Orbit of the planet. */
      this.orbit = orbit;
      /** Array of satellites. */
      this.satellites = [];
      /** Array of rings. */
      this.rings = [];
    }

    /**
     * Getter for the center of the planet.
     *
     * @returns {Point} Center of the planet.
     */
    get center() {
      return this.orbit.orbitalPoint;
    }

    /**
     * Add a satellite to the planet.
     *
     * @param {Satellite} satellite Satellite object.
     * @param {Number} distance Distance of the orbit from the planet.
     * @param {Time} fullRotationTime Complete turnover time.
     * @returns {Planet} The planet itself.
     */
    addSatellite(satellite, distance, fullRotationTime) {
      satellite.setOrbit(new Orbit(this, distance, fullRotationTime));
      this.satellites.push(satellite);

      return this;
    }

    /**
     * Add a ring to the planet.
     *
     * @param {Ring} ring Ring object.
     * @returns {Planet} The planet itself.
     */
    addRing(ring) {
      ring.setCenter(this);
      this.rings.push(ring);

      return this;
    }

    /**
     * Move planet to the next position.
     *
     * @returns {Planet} The planet itself.
     */
    move() {
      this.orbit.move();
      this.rotate();
      this.rings.forEach(ring => ring.move());
      this.satellites.forEach(satellite => satellite.move());

      return this;
    }

    /**
     * Get image of the object.
     * It can be overridden in the child class.
     *
     * @param {CanvasImageSource} image Image object.
     * @returns {CanvasImageSource} Image object.
     * @private
     */
    _getImage(image) {
      // Create offscreen canvas.
      const offScreenCanvas = document.createElement('canvas');
      const offScreenCtx = offScreenCanvas.getContext('2d');
      offScreenCtx.clearRect(0, 0, offScreenCanvas.width, offScreenCanvas.height);

      // Create a temporary canvas to work with the planet.
      offScreenCanvas.width = image.width;
      offScreenCanvas.height = image.height;

      const planetCenter = new Point(0, 0);
      const distanceFromSunToPlanet = this.orbit.radius;
      const planetToSunAngle = new Angle(180 + this.orbit.angle.degree - this.angle.degree);
      const sunCenter = new Point(
        planetCenter.x + distanceFromSunToPlanet * Math.cos(planetToSunAngle.toRadians()),
        planetCenter.y + distanceFromSunToPlanet * Math.sin(planetToSunAngle.toRadians())
      );

      const planetRadius = Math.max(image.width, image.height) / 2;
      const innerRadius = distanceFromSunToPlanet - planetRadius;
      const outerRadius = distanceFromSunToPlanet + planetRadius;

      offScreenCtx.save();
      // Draw the planet on the temporary canvas.
      offScreenCtx.translate(offScreenCanvas.width / 2, offScreenCanvas.height / 2);
      offScreenCtx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);

      // Create a gradient for the sunlight.
      const gradient = offScreenCtx.createRadialGradient(sunCenter.x, sunCenter.y, innerRadius, sunCenter.x, sunCenter.y, outerRadius);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.6)');
      gradient.addColorStop(0.9, 'rgba(0, 0, 0, 0.8)');

      // Draw sunlight on the temporary canvas.
      offScreenCtx.globalCompositeOperation = 'source-atop';
      offScreenCtx.beginPath();
      offScreenCtx.arc(sunCenter.x, sunCenter.y, innerRadius, 0, 2 * Math.PI);
      offScreenCtx.arc(sunCenter.x, sunCenter.y, outerRadius, 0, 2 * Math.PI, true);
      offScreenCtx.fillStyle = gradient;
      offScreenCtx.fill();

      offScreenCtx.restore();

      return offScreenCanvas;
    }

    /**
     * Draw planet on canvas.
     *
     * @param {CanvasRenderingContext2D} ctx Canvas context.
     */
    draw(ctx) {
      this.orbit.draw(ctx);
      super.draw(ctx, this.center);
      this.rings.forEach(ring => ring.draw(ctx));
      this.satellites.forEach(satellite => satellite.draw(ctx));
    }
  }

  class Ring {
    /**
     * @param {number} innerRadius Inner radius of the ring.
     * @param {number} outerRadius Outer radius of the ring.
     * @param {string} color Color of the ring.
     * @param {Time} fullRotationTime Complete turnover time.
     * @constructor
     */
    constructor(innerRadius, outerRadius, color, fullRotationTime) {
      this.innerRadius = innerRadius;
      this.outerRadius = outerRadius;
      this.color = color;
      this.angle = new Angle(0);
      this._delta = Angle.getRotationDelta(fullRotationTime);
      this._center = null;
    }

    /**
     * Set center of the ring.
     *
     * @param {Point|{center: Point}} center Center of the ring.
     */
    setCenter(center) {
      this._center = center;
    }

    /**
     * Getter for the center of the ring.
     *
     * @returns {Point|null} Center of the ring.
     */
    get center() {
      if (this._center?.center instanceof Point) {
        return this._center.center;
      }

      return this._center;
    }

    /**
     * Move ring to the next position.
     *
     * @returns {Ring} The ring itself.
     */
    move() {
      this.angle = this.angle.addDelta(this._delta);

      return this;
    }

    /**
     * Draw ring on canvas.
     *
     * @param {CanvasRenderingContext2D} ctx Canvas context.
     */
    draw (ctx) {
      ctx.save();
      ctx.translate(this.center.x, this.center.y);
      ctx.rotate(this.angle.toRadians());
      ctx.transform(1, 0.3, 0, 1, 0, 0);

      ctx.beginPath();
      ctx.arc(0, 0, this.outerRadius, 0, 2 * Math.PI);
      ctx.arc(0, 0, this.innerRadius, 0, 2 * Math.PI, true);
      ctx.fillStyle = this.color;
      ctx.fill();

      ctx.restore();
    }
  }

  class Satellite extends RotatableObject {
    /**
     * @param {string} src Path to the image.
     * @param {Size} size Size of the object.
     * @param {Time} fullRotationTime Complete turnover time.
     * @param {Orbit} [orbit=null] Orbit of the satellite.
     * @constructor
     */
    constructor(src, size, fullRotationTime, orbit = null) {
      super(src, size, fullRotationTime);
      /** Orbit of the satellite. */
      this.orbit = orbit;
    }

    /**
     * Set orbit of the satellite.
     *
     * @param {Orbit} orbit Orbit of the satellite.
     */
    setOrbit(orbit) {
      this.orbit = orbit;
    }

    /**
     * Getter for the center of the satellite.
     *
     * @returns {Point}
     */
    get center() {
      return this.orbit?.orbitalPoint;
    }

    /**
     * Move satellite to the next position.
     *
     * @returns {Satellite} The satellite itself.
     */
    move() {
      if (this.orbit) {
        this.orbit.move();
        this.rotate();
      }

      return this;
    }

    /**
     * Draw satellite on canvas.
     *
     * @param {CanvasRenderingContext2D} ctx Canvas context.
     * @throws {Error} If the orbit is not set.
     */
    draw(ctx) {
      if (!this.orbit) {
        throw new Error('Orbit is not set for the satellite.');
      }

      this.orbit.draw(ctx);
      super.draw(ctx, this.center);
    }
  }

  /**
   * Factory class to create planets.
   */
  class PlanetFactory {
    /**
     * Create a Mercury.
     *
     * @param {Point|{center: Point}} barycenter Barycenter of the planet.
     * @returns {Planet} Mercury.
     */
    static createMercury(barycenter) {
      return new Planet(IMAGES.MERCURY, new Size(10, 10), new Time(6), new Orbit(barycenter, 60, new Time(8.8)));
    }

    /**
     * Create a Venus.
     *
     * @param {Point|{center: Point}} barycenter Barycenter of the planet.
     * @returns {Planet} Venus.
     */
    static createVenus(barycenter) {
      return new Planet(IMAGES.VENUS, new Size(10, 10), new Time(25), new Orbit(barycenter, 80, new Time(22.5)));
    }

    /**
     * Create an Earth.
     *
     * @param {Point|{center: Point}} barycenter Barycenter of the planet.
     * @returns {Planet} Earth.
     */
    static createEarth(barycenter) {
      const earth = new Planet(IMAGES.EARTH, new Size(30, 30), new Time(6.5), new Orbit(barycenter, 120, new Time(36.5)));
      const moon = new Satellite(IMAGES.MOON, new Size(8, 8), new Time(2.73));
      earth.addSatellite(moon, 20, new Time(2.73));

      return earth;
    }

    /**
     * Create a Mars.
     *
     * @param {Point|{center: Point}} barycenter Barycenter of the planet.
     * @returns {Planet} Mars.
     */
    static createMars(barycenter) {
      return new Planet(IMAGES.MARS, new Size(18, 18), new Time(8), new Orbit(barycenter, 160, new Time(42)));
    }

    /**
     * Create a Jupiter.
     *
     * @param {Point|{center: Point}} barycenter Barycenter of the planet.
     * @returns {Planet} Jupiter.
     */
    static createJupiter(barycenter) {
      return new Planet(IMAGES.JUPITER, new Size(27, 27), new Time(24), new Orbit(barycenter, 200, new Time(57)));
    }

    /**
     * Create a Saturn.
     *
     * @param {Point|{center: Point}} barycenter Barycenter of the planet.
     * @returns {Planet} Saturn.
     */
    static createSaturn(barycenter) {
      const saturn = new Planet(IMAGES.SATURN, new Size(27, 27), new Time(28), new Orbit(barycenter, 240, new Time(62)));
      saturn.addRing(new Ring(17, 20, 'rgba(200, 200, 200, 0.5)', new Time(16)));

      return saturn;
    }

    /**
     * Create a Uranus.
     *
     * @param {Point|{center: Point}} barycenter Barycenter of the planet.
     * @returns {Planet} Uranus.
     */
    static createUranus(barycenter) {
      return new Planet(IMAGES.URANUS, new Size(24, 24), new Time(34), new Orbit(barycenter, 280, new Time(74)));
    }

    /**
     * Create a Neptune.
     *
     * @param {Point|{center: Point}} barycenter Barycenter of the planet.
     * @returns {Planet} Neptune.
     */
    static createNeptune(barycenter) {
      return new Planet(IMAGES.NEPTUNE, new Size(24, 24), new Time(40), new Orbit(barycenter, 320, new Time(81)));
    }

    /**
     * Create a Pluto.
     *
     * @param {Point|{center: Point}} barycenter Barycenter of the planet.
     * @returns {Planet} Pluto.
     */
    static createPluto(barycenter) {
      return new Planet(IMAGES.PLUTO, new Size(24, 24), new Time(44), new Orbit(barycenter, 360, new Time(90)));
    }

    /**
     * Create all planets of the solar system.
     *
     * @param {Point|{center: Point}} barycenter Barycenter of the planet.
     * @returns {Planet[]} Array of planets.
     */
    static createAllPlanets(barycenter) {
      return [
        this.createMercury(barycenter),
        this.createVenus(barycenter),
        this.createEarth(barycenter),
        this.createMars(barycenter),
        this.createJupiter(barycenter),
        this.createSaturn(barycenter),
        this.createUranus(barycenter),
        this.createNeptune(barycenter),
        this.createPluto(barycenter),
      ]
    }
  }

  class SolarSystem {
    /**
     * Solar System instance.
     *
     * @type {SolarSystem} Solar System instance.
     * @private
     * @static
     */
    static _instance = null;

    /**
     * @param {HTMLCanvasElement} canvas Canvas element.
     * @param {Point} barycenter Barycenter of the solar system.
     * @param {number} [starsCount=1000] Number of stars in the solar system.
     * @constructor
     */
    constructor(canvas, barycenter, starsCount = 1000) {
      /** Canvas element. */
      this.canvas = canvas;
      /**
       * Canvas context.
       * @private
       */
      this._canvasContext = this.canvas.getContext('2d');
      /** Barycenter of the solar system. */
      this.center = barycenter;
      /** Solar system stars. */
      this.stars = [];
      /** Sun object. */
      this.sun = null;
      /** Solar system planets. */
      this.planets = [];
    }

    /**
     * Initialize the solar system.
     */
    init() {
      this.stars = [];
      for (let i = 0; i < STARTS_COUNT; i++) {
        this.stars.push(Star.create());
      }
      this.sun = new Sun(this.center, new Size(80, 80), new Time(30));
      this.planets = PlanetFactory.createAllPlanets(this.sun);
    }

    /**
     * Get Solar System instance.
     *
     * @returns {SolarSystem}
     */
    static getInstance() {
      if (!this._instance) {
        this._instance = new SolarSystem(canvas, new Point(canvas.width / 2, canvas.height / 2));
        this._instance.init();
      }

      return this._instance;
    }

    /**
     * Move the solar system to the next frame.
     *
     * @returns {SolarSystem} The solar system itself.
     */
    move() {
      this.stars.forEach(star => star.move());
      this.sun.rotate();
      this.planets.forEach(planet => planet.move());

      return this;
    }

    /**
     * Draw the solar system on canvas.
     */
    draw() {
      this.stars.forEach(star => star.draw(this._canvasContext));
      this.sun.draw(this._canvasContext);
      this.planets.forEach(planet => planet.draw(this._canvasContext));
    }

    /**
     * Clear the canvas.
     */
    clear() {
      this._canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Main drawing function.
   */
  function draw() {
    const solarSystem = SolarSystem.getInstance();
    solarSystem.clear();
    solarSystem.move().draw();

    requestAnimationFrame(draw);
  }

  // Start drawing the solar system.
  document.addEventListener('DOMContentLoaded', draw);
})()