import { ArrowRight, LineChart, ShieldAlert, Target, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const modules = [
  {
    to: "/challenge",
    icon: Trophy,
    title: "Challenge opérateurs",
    description:
      "Classement des équipes, ventes par opérateur, cartes bonus et suivi du concours.",
    accent: "from-amber-300 via-orange-300 to-rose-300",
  },
  {
    to: "/laboratoires",
    icon: LineChart,
    title: "Comparatif laboratoires",
    description:
      "Lecture mensuelle du CA HT par laboratoire, avec vue globale et vues par acheteur.",
    accent: "from-sky-300 via-cyan-300 to-emerald-300",
  },
  {
    to: "/tg",
    icon: Target,
    title: "Têtes de gondole",
    description:
      "Scan terrain, suivi des produits en TG, historique et mesure de l'efficacité commerciale.",
    accent: "from-fuchsia-300 via-pink-300 to-amber-200",
  },
  {
    to: "/vigilance",
    icon: ShieldAlert,
    title: "Vigilance références",
    description:
      "Surveillance des références sensibles, ventes hebdomadaires, stock restant et notes acheteurs.",
    accent: "from-lime-300 via-emerald-300 to-teal-300",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/75 p-8 shadow-xl shadow-slate-200/70 backdrop-blur-xl sm:p-10">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(circle at 10% 20%, rgba(56,189,248,0.16), transparent 30%), radial-gradient(circle at 90% 10%, rgba(251,146,60,0.16), transparent 28%), radial-gradient(circle at 50% 100%, rgba(163,230,53,0.14), transparent 26%)",
          }}
        />
        <div className="relative max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Vision cible
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Une seule plateforme pour piloter ton commerce au quotidien.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Cette première base réunit les quatre usages existants dans une application
            web unique. L&apos;objectif suivant sera de centraliser aussi les scripts
            d&apos;alimentation pour qu&apos;un seul pipeline pousse les données vers une
            architecture commune, puis de décliner cette base en app iPhone.
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {modules.map(({ to, icon: Icon, title, description, accent }) => (
          <Link
            key={to}
            to={to}
            className="group relative overflow-hidden rounded-[30px] border border-white/70 bg-white/70 p-6 shadow-lg shadow-slate-200/60 transition-transform hover:-translate-y-1 hover:bg-white"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
            <div className="mb-6 inline-flex rounded-2xl bg-slate-900 p-3 text-white shadow-lg shadow-slate-900/15">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
              Ouvrir le module
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[28px] border border-white/70 bg-white/65 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Socle web unifié</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Navigation commune, authentification commune et réutilisation des composants
            déjà en place dans tes quatre sites.
          </p>
        </div>
        <div className="rounded-[28px] border border-white/70 bg-white/65 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Pipeline central</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Remplacement progressif des quatre scripts isolés par une seule couche
            d&apos;ingestion, avec secrets sortis du code.
          </p>
        </div>
        <div className="rounded-[28px] border border-white/70 bg-white/65 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Déclinaison iPhone</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            La base React unifiée pourra ensuite être emballée en application iOS, sans
            repartir de zéro côté logique métier.
          </p>
        </div>
      </section>
    </div>
  );
}
