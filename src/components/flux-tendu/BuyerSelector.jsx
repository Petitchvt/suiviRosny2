import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

export default function BuyerSelector({ buyers, selectedBuyer, onSelect, isLoading }) {
  return (
    <div className="w-full max-w-sm">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
        Sélectionnez votre profil
      </label>
      <Select value={selectedBuyer} onValueChange={onSelect} disabled={isLoading}>
        <SelectTrigger className="h-12 bg-card border-border/60 shadow-sm text-base">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-muted-foreground" />
            <SelectValue placeholder="Choisir un acheteur…" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {buyers.map((buyer) => (
            <SelectItem key={buyer} value={buyer} className="text-base py-2.5">
              {buyer}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}