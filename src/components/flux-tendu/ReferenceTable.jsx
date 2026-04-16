import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function TrendIndicator({ current, previous }) {
  if (current == null || previous == null) return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  if (current > previous) return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />;
  if (current < previous) return <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

export default function ReferenceTable({ references }) {
  return (
    <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">EAN</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Libellé</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Laboratoire</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                Ventes S-1
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                Ventes S
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Tendance</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {references.map((ref, index) => (
                <motion.tr
                  key={ref.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.25 }}
                  className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-mono text-sm text-muted-foreground">{ref.ean}</TableCell>
                  <TableCell className="font-medium text-sm max-w-[260px] truncate">{ref.libelle}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-xs">
                      {ref.laboratoire || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {ref.ventes_s1 != null ? ref.ventes_s1.toLocaleString("fr-FR") : "—"}
                    <span className="text-muted-foreground text-xs ml-1">({ref.semaine_s1 || "—"})</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium">
                    {ref.ventes_s != null ? ref.ventes_s.toLocaleString("fr-FR") : "—"}
                    <span className="text-muted-foreground text-xs ml-1">({ref.semaine_s || "—"})</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <TrendIndicator current={ref.ventes_s} previous={ref.ventes_s1} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {ref.note || "—"}
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}