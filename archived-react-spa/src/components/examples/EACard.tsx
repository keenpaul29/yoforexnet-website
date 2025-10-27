import EACard from '../EACard';
import eaIcon1 from '@assets/generated_images/EA_software_icon_1_ca83c324.png';

export default function EACardExample() {
  return (
    <div className="p-8 max-w-sm">
      <EACard
        id="1"
        name="Scalping Master Pro"
        description="Advanced scalping algorithm with built-in risk management and adaptive stop-loss"
        thumbnail={eaIcon1}
        platform="MT4"
        strategy="Scalping"
        rating={4.5}
        reviewCount={234}
        downloads={1520}
        price={149}
        profitFactor={1.85}
        verified={true}
      />
    </div>
  );
}
