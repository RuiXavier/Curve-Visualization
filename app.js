/**
 * @Author - Rui Xavier nº65815
 * @Author - Rodrigo Santos nº63263
 *
 * This is the main application file for the project. It contains the WebGL setup, event handlers, and main functions.
 */

import {
	buildProgramFromSources,
	loadShadersFromURLS,
	setupWebGL,
} from "./libs/utils.js";
import { vec2 } from "./libs/MV.js";
import Curve from "./curve.js";

// Constants
const NEW_CURVE_KEY = "z";
const CLEAR_CURVES_KEY = "c";
const ANIMATION_KEY = " ";
const SEGMENT_DECREASE_KEY = "-";
const SEGMENT_INCREASE_KEY = "+";
const SPEED_DECREASE_KEY = "<";
const SPEED_INCREASE_KEY = ">";
const TOGGLE_LINES_KEY = "l";
const TOGGLE_POINTS_KEY = "p";
const TOGGLE_SPECIAL_MODE_KEY = "s";

const MAX_POINTS = 60000;
const MAX_CONTROL_POINTS_PER_CURVE = 256;
const MOVE_THRESHOLD = 0.1;
const DISTANCE_THRESHOLD = 0.1;
const DEFAULT_VELOCITY = 0.01;
const DEFAULT_SEGMENTS = 1;
const BSPLINE_MODE = 0;
const BEZIER_MODE = 1;
const CATMULL_ROM_MODE = 2;
const DEFAULT_ANIMATION = true;
const DEFAULT_TOGGLE_LINES = true;
const DEFAULT_TOGGLE_POINTS = true;
const DEFAULT_SPECIAL_MODE = false;

// Variables
let gl, canvas, aspect;
let draw_program_bezier, draw_program_bspline, draw_points_bspline;
let draw_program_catmull_rom, draw_points_catmull_rom, draw_points_bezier;
let initial_position = null,
	mouse_pressed = false,
	is_dragging = false;
let control_points = [],
	curves = [],
	indices,
	index_buffer;
let base_velocity = DEFAULT_VELOCITY,
	num_segments = DEFAULT_SEGMENTS;
let curve_mode = BSPLINE_MODE,
	is_animating = DEFAULT_ANIMATION;
let next_curve_color, next_curve_size;
let draw_lines = DEFAULT_TOGGLE_LINES,
	draw_sample_points = DEFAULT_TOGGLE_POINTS;
let special_mode = DEFAULT_SPECIAL_MODE;
let next_shape_type;
let last_time = null;

// Event Handlers
function handleResize(event) {
	const width = event.target.innerWidth;
	const height = event.target.innerHeight;
	canvas.width = width;
	canvas.height = height;
	gl.viewport(0, 0, width, height);
}

function handleSliderInput(event) {
	base_velocity = parseFloat(event.target.value);
	curves.forEach((curve) => curve.updateVelocity(base_velocity));
	document.getElementById("velocityCount").textContent = base_velocity;
}

function handleSlider2Input(event) {
	num_segments = parseFloat(event.target.value);
	curves.forEach((curve) => curve.updateSegmentNum(num_segments));
	document.getElementById("numSegmentsDisplay").textContent = num_segments;
}

function handleClearButtonClick() {
	clearAll();
	document.getElementById("curveCount").textContent = curves.length;
}

function handleCurveModeChange(mode) {
	curve_mode = mode;
	updateCurveMode();
	document.getElementById("curveTypeDisplay").textContent = getCurveType();
	if (mode === CATMULL_ROM_MODE) {
		document.getElementById("buttonMatrix2").checked = true;
	} else if (mode === BEZIER_MODE) {
		document.getElementById("buttonMatrix1").checked = true;
	} else {
		document.getElementById("buttonMatrix0").checked = true;
	}
}

function handleMouseDown(event) {
	if (event.button !== 0) return;
	initial_position = getMousePosition(event);
	mouse_pressed = true;
	is_dragging = false;
}

function handleMouseMove(event) {
	if (!mouse_pressed) return;
	const current_position = getMousePosition(event);
	const distance = calculateDistance(initial_position, current_position);
	if (distance > MOVE_THRESHOLD && !is_dragging) {
		is_dragging = true;
		if (control_points.length > 0) finalizeCurve();
	} else if (is_dragging) {
		addControlPoint(current_position);
	}
}

function handleMouseUp(event) {
	if (!mouse_pressed) return;
	if (!is_dragging) {
		addControlPoint(initial_position);
	} else {
		finalizeCurve();
	}
	mouse_pressed = false;
	is_dragging = false;
}

function handleKeyPress(event) {
	const key = event.key.toLowerCase();
	switch (key) {
		case NEW_CURVE_KEY:
			finalizeCurve();
			break;
		case CLEAR_CURVES_KEY:
			clearAll();
			break;
		case ANIMATION_KEY:
			toggleAnimation();
			break;
		case SEGMENT_DECREASE_KEY:
			updateSegments(-1);
			break;
		case SEGMENT_INCREASE_KEY:
			updateSegments(1);
			break;
		case SPEED_DECREASE_KEY:
			updateBaseVelocity(-0.01);
			break;
		case SPEED_INCREASE_KEY:
			updateBaseVelocity(0.01);
			break;
		case TOGGLE_LINES_KEY:
			toggleLines();
			break;
		case TOGGLE_POINTS_KEY:
			togglePoints();
			break;
		case BSPLINE_MODE.toString():
			handleCurveModeChange(BSPLINE_MODE);
			break;
		case BEZIER_MODE.toString():
			handleCurveModeChange(BEZIER_MODE);
			break;
		case CATMULL_ROM_MODE.toString():
			handleCurveModeChange(CATMULL_ROM_MODE);
			break;
		case TOGGLE_SPECIAL_MODE_KEY:
			toggleSpecialMode();
			break;
		default:
			break;
	}
}

// Utility Functions
buttonMatrix2.addEventListener("mousedown", function (e) {
	e.stopPropagation();
});

buttonMatrix0.addEventListener("mousedown", function (e) {
	e.stopPropagation();
});

buttonMatrix1.addEventListener("mousedown", function (e) {
	e.stopPropagation();
});

slider.addEventListener("mousedown", function (e) {
	e.stopPropagation();
});

// Stop event propagation when interacting with the slider
slider2.addEventListener("mousedown", function (e) {
	e.stopPropagation();
});

specialM.addEventListener("mousedown", function (e) {
	e.stopPropagation();
	toggleSpecialMode();
});

function getMousePosition(event) {
	const rect = canvas.getBoundingClientRect();
	const x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
	const y = -(((event.clientY - rect.top) / canvas.height) * 2 - 1);
	return vec2(x, y);
}

function calculateDistance(pos1, pos2) {
	return Math.sqrt(
		Math.pow(pos2[0] - pos1[0], 2) + Math.pow(pos2[1] - pos1[1], 2)
	);
}

function toggleAnimation() {
	is_animating = !is_animating;
	document.getElementById("animationDisplay").textContent = is_animating;
}

function updateSegments(change) {
	num_segments = Math.max(1, Math.min(100, num_segments + change));
	curves.forEach((curve) => curve.updateSegmentNum(num_segments));
	document.getElementById("numSegmentsDisplay").textContent = num_segments;
	document.getElementById("slider2").value = num_segments;
}

function updateBaseVelocity(change) {
	base_velocity =
		Math.round(Math.max(-1, Math.min(1, base_velocity + change)) * 1000) / 1000;
	document.getElementById("velocityCount").textContent = base_velocity;
	document.getElementById("slider").value = base_velocity;
}

function calculateVelocity(curveVelocity) {
	curves.forEach((curve) => curve.updateVelocity(curveVelocity));
}

function toggleLines() {
	draw_lines = !draw_lines;
}

function togglePoints() {
	draw_sample_points = !draw_sample_points;
}

function toggleSpecialMode() {
	special_mode = !special_mode;
	curves.forEach((curve) => curve.updateSpecialMode(special_mode));
	document.getElementById("specialMode").textContent = special_mode;
}

function getCurveType() {
	switch (curve_mode) {
		case BSPLINE_MODE:
			return "B-Spline";
		case BEZIER_MODE:
			return "Bezier";
		case CATMULL_ROM_MODE:
			return "Catmull-Rom";
	}
}

function generateNewColorSizeAndShape() {
	next_curve_color = [
		Math.random() + 0.05,
		Math.random() + 0.05,
		Math.random() + 0.05,
		Math.random() * 0.7 + 0.3,
	];
	next_curve_size = Math.random() * 20.0 + 20.0;

	let tmp = Math.random() * 1.5;
	if (tmp < 0.5) {
		next_shape_type = 0;
	} else if (tmp >= 0.5 && tmp < 1.0) {
		next_shape_type = 1;
	} else {
		next_shape_type = 2;
	}
}

function clearAll() {
	curves = [];
	control_points = [];
	document.getElementById("curveCount").textContent = curves.length;
}

function updateCurveMode() {
	curves.forEach((curve) => curve.updateMode(curve_mode));
}

// Main Functions
/**
 * Initializes the WebGL context, sets up shader programs, buffers, event listeners, and UI elements.
 *
 * @param {Object} shaders - An object containing the shader source codes.
 * @param {string} shaders["shader.vert"] - Vertex shader source code for general drawing.
 * @param {string} shaders["shader.frag"] - Fragment shader source code for general drawing.
 * @param {string} shaders["bezier.vert"] - Vertex shader source code for Bezier curves.
 * @param {string} shaders["catmull_rom.vert"] - Vertex shader source code for Catmull-Rom splines.
 * @param {string} shaders["drawpoints.frag"] - Fragment shader source code for drawing points.
 *
 * @global
 * @property {HTMLCanvasElement} canvas - The canvas element used for WebGL rendering.
 * @property {WebGLRenderingContext} gl - The WebGL rendering context.
 * @property {WebGLProgram} draw_program_bspline - Shader program for drawing B-spline curves.
 * @property {WebGLProgram} draw_program_bezier - Shader program for drawing Bezier curves.
 * @property {WebGLProgram} draw_program_catmull_rom - Shader program for drawing Catmull-Rom splines.
 * @property {WebGLProgram} draw_points_bspline - Shader program for drawing points on B-spline curves.
 * @property {WebGLProgram} draw_points_catmull_rom - Shader program for drawing points on Catmull-Rom splines.
 * @property {WebGLProgram} draw_points_bezier - Shader program for drawing points on Bezier curves.
 * @property {WebGLBuffer} index_buffer - Buffer for storing indices.
 * @property {Uint32Array} indices - Array of indices for the buffer.
 *
 * @fires window#resize
 * @fires window#mousedown
 * @fires window#mousemove
 * @fires window#mouseup
 * @fires window#keydown
 *
 * @listens window#resize - Calls handleResize when the window is resized.
 * @listens window#mousedown - Calls handleMouseDown when the mouse button is pressed.
 * @listens window#mousemove - Calls handleMouseMove when the mouse is moved.
 * @listens window#mouseup - Calls handleMouseUp when the mouse button is released.
 * @listens window#keydown - Calls handleKeyPress when a key is pressed.
 *
 * @listens HTMLInputElement#input - Calls handleSliderInput when the slider value changes.
 * @listens HTMLInputElement#input - Calls handleSlider2Input when the second slider value changes.
 * @listens HTMLButtonElement#click - Calls handleClearButtonClick when the clear button is clicked.
 * @listens HTMLInputElement#input - Calls handleCurveModeChange with BSPLINE_MODE when the first matrix button is clicked.
 * @listens HTMLInputElement#input - Calls handleCurveModeChange with BEZIER_MODE when the second matrix button is clicked.
 * @listens HTMLInputElement#input - Calls handleCurveModeChange with CATMULL_ROM_MODE when the third matrix button is clicked.
 *
 * @returns {void}
 */
function setup(shaders) {
	canvas = document.getElementById("gl-canvas");
	gl = setupWebGL(canvas, { alpha: true });

	draw_program_bspline = buildProgramFromSources(
		gl,
		shaders["shader.vert"],
		shaders["shader.frag"]
	);
	draw_program_bezier = buildProgramFromSources(
		gl,
		shaders["bezier.vert"],
		shaders["shader.frag"]
	);
	draw_program_catmull_rom = buildProgramFromSources(
		gl,
		shaders["catmull_rom.vert"],
		shaders["shader.frag"]
	);
	draw_points_bspline = buildProgramFromSources(
		gl,
		shaders["shader.vert"],
		shaders["drawpoints.frag"]
	);
	draw_points_catmull_rom = buildProgramFromSources(
		gl,
		shaders["catmull_rom.vert"],
		shaders["drawpoints.frag"]
	);
	draw_points_bezier = buildProgramFromSources(
		gl,
		shaders["bezier.vert"],
		shaders["drawpoints.frag"]
	);

	generateNewColorSizeAndShape();

	// Create the index buffer
	index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, index_buffer);
	indices = new Uint32Array(MAX_POINTS);
	for (let i = 0; i < MAX_POINTS; i++) indices[i] = i;
	gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	window.addEventListener("resize", handleResize);
	window.addEventListener("mousedown", handleMouseDown);
	window.addEventListener("mousemove", handleMouseMove);
	window.addEventListener("mouseup", handleMouseUp);
	window.addEventListener("keydown", handleKeyPress);

	document.getElementById("slider").oninput = handleSliderInput;
	document.getElementById("slider2").oninput = handleSlider2Input;
	document.getElementById("clear").onclick = handleClearButtonClick;
	document.getElementById("buttonMatrix0").oninput = () =>
		handleCurveModeChange(BSPLINE_MODE);
	document.getElementById("buttonMatrix1").oninput = () =>
		handleCurveModeChange(BEZIER_MODE);
	document.getElementById("buttonMatrix2").oninput = () =>
		handleCurveModeChange(CATMULL_ROM_MODE);

	document.getElementById("curveTypeDisplay").textContent = getCurveType();
	document.getElementById("velocityCount").textContent = base_velocity;
	document.getElementById("curveCount").textContent = curves.length;
	document.getElementById("animationDisplay").textContent = is_animating;
	document.getElementById("numSegmentsDisplay").textContent = num_segments;

	window.requestAnimationFrame(animate);

	handleResize({ target: window });
}

/**
 * The animation loop that updates and renders the scene.
 * @param {DOMHighResTimeStamp} timestamp - The current time in milliseconds.
 */
function animate(timestamp) {
	window.requestAnimationFrame(animate);
	if (!last_time) {
		last_time = timestamp;
		clearAll();
	}
	const elapsed = timestamp - last_time;
	gl.clear(gl.COLOR_BUFFER_BIT);

	switch (curve_mode) {
		case BEZIER_MODE:
			gl.useProgram(draw_program_bezier);
			break;
		case CATMULL_ROM_MODE:
			gl.useProgram(draw_program_catmull_rom);
			break;
		default:
			gl.useProgram(draw_program_bspline);
	}

	calculateVelocity(Math.round(((base_velocity * elapsed) / 7) * 1000) / 1000);
	renderCurves();
	gl.useProgram(null);
	last_time = timestamp;
}

/**
 * Adds a control point to the current curve being drawn.
 * @param {vec2} coordinates - The coordinates of the control point.
 */
function addControlPoint(coordinates) {
	if (control_points.length >= MAX_CONTROL_POINTS_PER_CURVE) {
		control_points.shift();
	}

	if (is_dragging) {
		if (control_points.length === 0) {
			control_points.push(coordinates);
		} else {
			const last_control_point = control_points[control_points.length - 1];
			const distance = calculateDistance(coordinates, last_control_point);
			if (distance >= DISTANCE_THRESHOLD) {
				control_points.push(coordinates);
			}
		}
	} else {
		control_points.push(coordinates);
	}
}

/**
 * Finalizes the current curve by adding it to the list of curves.
 */
function finalizeCurve() {
	if (control_points.length < 4) {
		return;
	}
	curves.push(
		new Curve(
			control_points,
			base_velocity,
			num_segments,
			next_curve_color,
			next_curve_size,
			curve_mode,
			special_mode,
			next_shape_type
		)
	);
	generateNewColorSizeAndShape();
	control_points = [];
	document.getElementById("curveCount").textContent = curves.length;
}

/**
 * Renders all the curves and their sample points.
 */
function renderCurves() {
	curves.forEach((curve) => {
		if (is_animating) curve.updatePositions();
		if (draw_lines) curve.render(gl, getProgramForCurveMode(), index_buffer);
		if (draw_sample_points)
			curve.renderSamplePoints(
				gl,
				getPointsProgramForCurveMode(),
				index_buffer
			);
	});

	if (control_points.length >= 4) {
		const tempCurve = new Curve(
			control_points,
			base_velocity,
			num_segments,
			next_curve_color,
			next_curve_size,
			curve_mode,
			special_mode,
			next_shape_type
		);
		if (draw_lines)
			tempCurve.render(gl, getProgramForCurveMode(), index_buffer);
		if (draw_sample_points)
			tempCurve.renderSamplePoints(
				gl,
				getPointsProgramForCurveMode(),
				index_buffer
			);
	}
}

/**
 * Returns the appropriate shader program for the current curve mode.
 * @returns {WebGLProgram} The shader program for the current curve mode.
 */
function getProgramForCurveMode() {
	switch (curve_mode) {
		case BEZIER_MODE:
			return draw_program_bezier;
		case CATMULL_ROM_MODE:
			return draw_program_catmull_rom;
		default:
			return draw_program_bspline;
	}
}

/**
 * Returns the appropriate shader program for drawing points for the current curve mode.
 * @returns {WebGLProgram} The shader program for drawing points for the current curve mode.
 */
function getPointsProgramForCurveMode() {
	switch (curve_mode) {
		case BEZIER_MODE:
			return draw_points_bezier;
		case CATMULL_ROM_MODE:
			return draw_points_catmull_rom;
		default:
			return draw_points_bspline;
	}
}

loadShadersFromURLS([
	"shader.vert",
	"shader.frag",
	"drawpoints.frag",
	"bezier.vert",
	"catmull_rom.vert",
])
	.then(setup)
	.catch((error) => console.error("Error loading shaders:", error));
