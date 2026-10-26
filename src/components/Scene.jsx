import { TempleNightScene } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export function Scene({ isPaused = false }) {
  return (
    <div className="shader-frame">
      <TempleNightScene
        variant="temple-night"
        isPaused={isPaused}
      />
    </div>
  );
}
