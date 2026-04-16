import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { labelSemaine } from "@/lib/semaineUtils";

export default function SemainePicker({ semaines, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-52 h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="global">🌐 Toute la période</SelectItem>
          {semaines.map((s) => (
            <SelectItem key={s} value={s}>📆 {labelSemaine(s)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}