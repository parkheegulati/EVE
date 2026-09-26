const { Centre, Test } = require('../models');

exports.getAllCentres = async (req, res) => {
  try {
    const centres = await Centre.findAll();
    res.json(centres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTestsByCentre = async (req, res) => {
  try {
    const { id } = req.params;

    const centre = await Centre.findByPk(id);
    if (!centre) {
      return res.status(404).json({ error: 'Centre not found' });
    }

    const tests = await Test.findAll({
      where: { centre_id: id }
    });

    res.json(tests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
