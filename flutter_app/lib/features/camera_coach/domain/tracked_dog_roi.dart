import 'dog_tracking.dart';
import 'quadruped_pose.dart';

const trackedDogRoiPadding = 1.35;

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

  NormalizedCropRect normalized(int frameWidth, int frameHeight) {
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

PixelCropRect trackedDogSquareCrop(
  int frameWidth,
  int frameHeight,
  NormalizedDogBox box,
) {
  if (frameWidth <= 0 || frameHeight <= 0) {
    throw ArgumentError('Frame dimensions must be positive.');
  }

  final centerX = (box.left + box.width / 2) * frameWidth;
  final centerY = (box.top + box.height / 2) * frameHeight;
  final dogWidth = box.width * frameWidth;
  final dogHeight = box.height * frameHeight;
  final paddedSide =
      (dogWidth > dogHeight ? dogWidth : dogHeight) * trackedDogRoiPadding;
  final maxSide = frameWidth < frameHeight ? frameWidth : frameHeight;
  final side = paddedSide.clamp(1.0, maxSide.toDouble());

  final maxX = frameWidth - side;
  final maxY = frameHeight - side;
  final originX = (centerX - side / 2).clamp(0.0, maxX);
  final originY = (centerY - side / 2).clamp(0.0, maxY);

  return PixelCropRect(
    originX: originX.floor(),
    originY: originY.floor(),
    width: side.floor(),
    height: side.floor(),
  );
}

QuadrupedPose mapQuadrupedPoseFromCrop(
  QuadrupedPose pose,
  NormalizedCropRect crop,
) {
  final keypoints = <QuadrupedJoint, PoseKeypoint>{
    for (final joint in QuadrupedJoint.values)
      joint: PoseKeypoint(
        x: crop.left + pose.point(joint).x * crop.width,
        y: crop.top + pose.point(joint).y * crop.height,
        confidence: pose.point(joint).confidence,
      ),
  };
  return QuadrupedPose(keypoints: Map.unmodifiable(keypoints));
}
