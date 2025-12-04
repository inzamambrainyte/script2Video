import { Composition, registerRoot } from "remotion";
import { VideoComposition } from "./VideoComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition}
        durationInFrames={300} // 10 seconds at 30fps (will be dynamic)
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          scenes: [],
        }}
      />
    </>
  );
};

// Register the root component (required by Remotion)
registerRoot(RemotionRoot);
