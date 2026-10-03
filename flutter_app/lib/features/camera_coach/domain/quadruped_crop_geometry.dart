import 'dog_tracking.dart';
import 'quadruped_pose.dart';

const dogGuideWidthRatio = 0.84;
const dogGuideTopRatio = 0.08;
const trackedDogCropPadding = 1.35;

class PixelCropRect {
  const PixelCropRect({
    required this.originX,
    required this.originY,
    required this.width,
    required this.height,
  });

  final int originX;
  final int originY;
  final int width;
  final int height;

  NormalizedCropRect normalise({
    required int frameWidth,
    required int frameHeight,
  }) {
    if (frameWidth <= 0 || frameHeight <= 0) {
      throw ArgumentError('Frame dimensions must be positive.');
    }
    return NormalizedCropRect(
      left: originX / frameWidth,
      top: originY / frameHeight,
      width: width / frameWidth,
      height: height / frameHeight,
    );
  }
}

class NormalizedCropRect {
  const NormalizedCropRect({
    required this.left,
    required this.top,
    required this.width,
    required this.height,
  });

  final double left;
  final double top;
  final double width;
  final double height;
}

PixelCropRect dogGuideSquareCrop({
  required int frameWidth,
  required int frameHeight,
}) {
  _validateFrameSize(frameWidth, frameHeight);

  final shorterSide = frameWidth < frameHeight ? frameWidth : frameHeight;
  final side = _atLeastOne((shorterSide * dogGuideWidthRatio).floor());
  final maxX = frameWidth - side;
  final maxY = frameHeight - side;
  final originX = _clampInt(((frameWidth - side) / 2).floor(), 0, maxX);
  final originY = _clampInt(
    (frameHeight * dogGuideTopRatio).floor(),
    0,
    maxY,
  );

  return PixelCropRect(
    originX: originX,
    originY: originY,
    width: side,
    height: side,
  );
}

PixelCropRect trackedDogSquareCrop({
  required int frameWidth,
  required int frameHeight,
  required NormalizedDogBox box,
}) {
  _validateFrameSize(frameWidth, frameHeight);

  final safeLeft = _clamp01(box.left);
  final safeTop = _clamp01(box.top);
  final safeWidth = _clamp01(box.width);
  final safeHeight = _clamp01(box.height);

  final centerX = (safeLeft + safeWidth / 2) * frameWidth;
  final centerY = (safeTop + safeHeight / 2) * frameHeight;
  final boxPixelWidth = safeWidth * frameWidth;
  final boxPixelHeight = safeHeight * frameHeight;
  final boxSide =
      boxPixelWidth > boxPixelHeight ? boxPixelWidth : boxPixelHeight;
  final shorterSide = frameWidth < frameHeight ? frameWidth : frameHeight;
  final paddedSide = boxSide * trackedDogCropPadding;
  final sideDouble = paddedSide < 1
      ? 1.0
      : paddedSide > shorterSide
      ? shorterSide.toDouble()
      : paddedSide;
  final side = _atLeastOne(sideDouble.floor());

  final maxX = frameWidth - side;
  final maxY = frameHeight - side;
  final originX = _clampDouble(centerX - side / 2, 0, maxX.toDouble()).floor();
  final originY = _clampDouble(centerY - side / 2, 0, maxY.toDouble()).floor();

  return PixelCropRect(
    originX: originX,
    originY: originY,
    width: side,
    height: side,
  );
}

QuadrupedPose mapQuadrupedPoseFromCrop(
  QuadrupedPose cropPose,
  NormalizedCropRect crop,
) {
  final keypoints = <QuadrupedJoint, PoseKeypoint>{};
  for (final joint in QuadrupedJoint.values) {
    final point = cropPose.point(joint);
    keypoints[joint] = PoseKeypoint(
      x: _clamp01(crop.left + point.x * crop.width),
      y: _clamp01(crop.top + point.y * crop.height),
      confidence: _clamp01(point.confidence),
    );
  }
  return QuadrupedPose(keypoints: Map.unmodifiable(keypoints));
}

void _validateFrameSize(int width, int height) {
  if (width <= 0 || height <= 0) {
    throw ArgumentError('Frame dimensions must be positive.');
  }
}

int _atLeastOne(int value) => value < 1 ? 1 : value;

int _clampInt(int value, int minimum, int maximum) {
  if (value < minimum) return minimum;
  if (value > maximum) return maximum;
  return value;
}

double _clampDouble(double value, double minimum, double maximum) {
  if (value < minimum) return minimum;
  if (value > maximum) return maximum;
  return value;
}

double _clamp01(double value) => _clampDouble(value, 0, 1);
