import { Composition } from "remotion";
import type { AnyZodObject } from "remotion";
import { ReelComposition } from "../components/video/reel-composition";
import { ReelCompositionProps } from "../components/video/reel-composition";
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS } from "../lib/video-config";

const defaultReelProps: ReelCompositionProps = {
  items: [],
  roomType: "Bedroom",
  budgetPhrase: "under $100",
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition<AnyZodObject, ReelCompositionProps>
      id="Reel"
      component={ReelComposition}
      durationInFrames={60 * VIDEO_FPS} // Default duration, overwritten by API during render
      fps={VIDEO_FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      defaultProps={defaultReelProps}
    />
  );
};
