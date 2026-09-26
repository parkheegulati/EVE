const express = require('express');
const router = express.Router();
const centreController = require('../controllers/centreController');

/**
 * @swagger
 * /centres:
 *   get:
 *     summary: List all centres
 *     tags: [Centres]
 *     responses:
 *       200:
 *         description: A list of diagnostic centres
 */
router.get('/', centreController.getAllCentres);

/**
 * @swagger
 * /centres/{id}/tests:
 *   get:
 *     summary: List tests for a specific centre
 *     tags: [Centres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of tests for the centre
 *       404:
 *         description: Centre not found
 */
router.get('/:id/tests', centreController.getTestsByCentre);

module.exports = router;
