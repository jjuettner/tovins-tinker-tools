import { Heart } from "lucide-react";
import { hpHeartClassForValues } from "@/components/ui/hpHeartClass";

export default function HpReadonlyBadge(props: {
  currentHp: number;
  maxHp: number;
  tempHp?: number;
  label?: string;
}) {
  const hpCls = hpHeartClassForValues({ currentHp: props.currentHp, maxHp: props.maxHp });
  const temp = props.tempHp ?? 0;
  const label = props.label ?? "HP";

  return (
    <div className={`flex items-center gap-2 text-sm font-semibold tracking-tight ${hpCls}`}>
      <Heart className="h-5 w-5 shrink-0 fill-current" aria-hidden="true" />
      <span>
        <span className="mr-1 text-xs font-medium opacity-90">{label}</span>
        <span className="tabular-nums">
          {props.currentHp}/{props.maxHp}
        </span>
        {temp > 0 ? <span className="font-medium"> (+{temp})</span> : null}
      </span>
    </div>
  );
}
