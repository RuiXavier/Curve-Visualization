/**
 * @Author - Rui Xavier nº65815
 * @Author - Rodrigo Santos nº63263
 *
 * This file contains the Curve class which is responsible for creating and rendering each individual curve.
 */

import { vec2 } from "./libs/MV.js"; // Ensure vec2 is correctly imported

class Curve {
	/**
	 * Constructor for the Curve class.
	 * @param {Array} control_points - Array of control points.
	 * @param {Number} base_velocity - Base velocity of the curve.
	 * @param {Number} num_segments - Number of segments of the curve.
	 * @param {Array} colors - Array of colors.
	 * @param {Number} curve_mode - Curve mode (BSpline or Bezier or Catmull-Rom).
	 */
	constructor(
		control_points,
		base_velocity,
		num_segments,
		colors,
		point_size,
		curve_mode,
		special_mode,
		shapeType
	) {
		this.control_points = [...control_points]; // Clone to prevent external mutations
		this.base_velocity = base_velocity;
		this.num_segments = num_segments;
		this.direction_X = Math.random() < 0.5 ? -1 : 1;
		this.direction_Y = Math.random() < 0.5 ? -1 : 1;
		this.colors = colors;
		this.curve = curve_mode;
		this.point_size = point_size;
		this.special_mode = special_mode;
		this.shapeType = shapeType;
		this.velocities = this.initializeVelocities();
	}

	// Initializes velocities with a base velocity and minimal perturbations.
	initializeVelocities() {
		return this.control_points.map(() => {
			let perturbation_X = Math.random() * 0.01 + 0.001;
			let perturbation_Y = Math.random() * 0.01 + 0.001;

			let speed_X =
				0.03 * this.base_velocity +
				this.base_velocity * perturbation_X * this.direction_X;
			let speed_Y =
				0.03 * this.base_velocity +
				this.base_velocity * perturbation_Y * this.direction_Y;

			return [
				vec2(speed_X, speed_Y),
				vec2(this.direction_X, this.direction_Y),
				vec2(perturbation_X, perturbation_Y),
			];
		});
	}

	// Updates the base velocity of the curve thereby updating the velocity of each control point.
	updateVelocity(newVelocity) {
		this.base_velocity = newVelocity;
		this.velocities = this.velocities.map((_, index) => {
			let directions = this.velocities[index][1];
			let perturbations = this.velocities[index][2];

			let speed_X =
				0.03 * this.base_velocity +
				this.base_velocity * perturbations[0] * directions[0];
			let speed_Y =
				0.03 * this.base_velocity +
				this.base_velocity * perturbations[1] * directions[1];

			return [vec2(speed_X, speed_Y), directions, perturbations];
		});
	}

	// Updates control points based on their velocities and bounces them off edges.
	updatePositions() {
		this.control_points = this.control_points.map((point, index) => {
			let [x, y] = point;

			if (this.special_mode) {
				x += this.velocities[index][0][0] * 200 * (Math.random() - 0.5);
				y += this.velocities[index][0][1] * 200 * (Math.random() - 0.5);
			} else {
				x += this.velocities[index][0][0] * this.velocities[index][1][0];
				y += this.velocities[index][0][1] * this.velocities[index][1][1];
			}

			if (x <= -1 || x >= 1) {
				this.velocities[index][1][0] *= -1;
				x = Math.max(-1, Math.min(1, x));
			}
			if (y <= -1 || y >= 1) {
				this.velocities[index][1][1] *= -1;
				y = Math.max(-1, Math.min(1, y));
			}

			return vec2(x, y);
		});
	}

	// Renders the curve using WebGL.
	render(gl, program, indexBuffer) {
		if (this.control_points.length < 4) return;

		gl.useProgram(program);

		const flat_points = this.control_points.flatMap((p) => [p[0], p[1]]);
		const control_points_loc = gl.getUniformLocation(program, "control_points");
		const segments_loc = gl.getUniformLocation(program, "num_segments");

		if (control_points_loc && segments_loc) {
			gl.uniform2fv(control_points_loc, new Float32Array(flat_points));
			gl.uniform1i(segments_loc, this.num_segments);

			const color = gl.getUniformLocation(program, "u_color");
			this.special_mode
				? gl.uniform4f(color, Math.random(), Math.random(), Math.random(), 1.0)
				: gl.uniform4f(
						color,
						this.colors[0],
						this.colors[1],
						this.colors[2],
						this.colors[3]
				  );

			let num_points;
			if (this.curve === 0 || this.curve === 2) {
				num_points = this.num_segments * (this.control_points.length - 3);
			} else if (this.curve === 1) {
				num_points =
					(this.num_segments + 1) *
						Math.floor((this.control_points.length - 1) / 3) -
					Math.floor((this.control_points.length - 1) / 3) +
					1;
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
			const indexAttrLoc = gl.getAttribLocation(program, "index");

			if (indexAttrLoc !== -1) {
				gl.vertexAttribIPointer(indexAttrLoc, 1, gl.UNSIGNED_INT, 0, 0);
				gl.enableVertexAttribArray(indexAttrLoc);
				gl.drawArrays(gl.LINE_STRIP, 0, num_points);
			} else {
				console.error("Failed to get 'index' attribute location.");
			}
		} else {
			console.error("Failed to get uniform locations.");
		}
	}

	// Renders the sample points of the curve using WebGL.
	renderSamplePoints(gl, program, indexBuffer) {
		if (this.control_points.length < 4) return;

		gl.useProgram(program);

		const flatPoints = this.control_points.flatMap((p) => [p[0], p[1]]);
		const controlPointsLoc = gl.getUniformLocation(program, "control_points");
		const segmentsLoc = gl.getUniformLocation(program, "num_segments");

		if (controlPointsLoc && segmentsLoc) {
			gl.uniform2fv(controlPointsLoc, new Float32Array(flatPoints));
			gl.uniform1i(segmentsLoc, this.num_segments);

			const color = gl.getUniformLocation(program, "u_color");
			this.special_mode
				? gl.uniform4f(color, Math.random(), Math.random(), Math.random(), 1.0)
				: gl.uniform4f(
						color,
						this.colors[0],
						this.colors[1],
						this.colors[2],
						this.colors[3]
				  );

			const size = gl.getUniformLocation(program, "u_size");
			this.special_mode
				? gl.uniform1f(size, Math.random() * 70.0 + 20.0)
				: gl.uniform1f(size, this.point_size);

			let num_points;
			if (this.curve === 0 || this.curve === 2) {
				num_points = this.num_segments * (this.control_points.length - 3);
			} else if (this.curve === 1) {
				num_points =
					(this.num_segments + 1) *
						Math.floor((this.control_points.length - 1) / 3) -
					Math.floor((this.control_points.length - 1) / 3) +
					1;
			}

			const current_time = performance.now() / 1000.0;
			const time_loc = gl.getUniformLocation(program, "u_time");
			gl.uniform1f(time_loc, current_time);

			const shapeType = gl.getUniformLocation(program, "u_shapeType");
			if (this.special_mode) {
				gl.uniform1i(shapeType, (this.shapeType + 1) % 3);
			} else {
				gl.uniform1i(shapeType, this.shapeType);
			}

			// Bind and set the index buffer
			gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
			const indexAttrLoc = gl.getAttribLocation(program, "index");

			if (indexAttrLoc !== -1) {
				gl.vertexAttribIPointer(indexAttrLoc, 1, gl.UNSIGNED_INT, 0, 0);
				gl.enableVertexAttribArray(indexAttrLoc);
				gl.drawArrays(gl.POINTS, 0, num_points);
			} else {
				console.error("Failed to get 'index' attribute location.");
			}
		} else {
			console.error("Failed to get uniform locations.");
		}
	}

	// Updates the number of segments of the curve.
	updateSegmentNum(new_num_segments) {
		this.num_segments = new_num_segments;
	}

	// Updates the special mode of the curve.
	updateSpecialMode(newMode) {
		this.special_mode = newMode;
	}

	// Updates the curve mode.
	updateMode(newMode) {
		this.curve = newMode;
	}
}

export default Curve;
