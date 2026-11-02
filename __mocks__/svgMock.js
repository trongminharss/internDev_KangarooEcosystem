const React = require('react');
const SvgMock = React.forwardRef((props, ref) =>
  React.createElement('SvgMock', {...props, ref}),
);
module.exports = SvgMock;
module.exports.default = SvgMock;
