import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EtatBadge,
  FieldHint,
  Input,
  Label,
  PageHeader,
  Select,
  StatutBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  Textarea,
} from '~/components/ui'

export const Route = createFileRoute('/styleguide')({
  component: Styleguide,
})

function Styleguide() {
  return (
    <>
      <PageHeader
        title="Styleguide"
        description="Source de vérité visuelle du système de prêt de matériel. Tous les écrans métier réutilisent ces tokens et composants — toute divergence est un bug."
        actions={
          <>
            <Button variant="secondary" size="sm">
              Imprimer
            </Button>
            <Button size="sm">Valider</Button>
          </>
        }
      />

      <div className="space-y-12">
        <SectionPalette />
        <SectionTypography />
        <SectionRadiusShadow />
        <SectionButtons />
        <SectionFormFields />
        <SectionBadges />
        <SectionCards />
        <SectionTable />
      </div>
    </>
  )
}

/* ---------- Section helper ---------- */
function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <header className="mb-4 pb-2 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        {hint && (
          <p className="mt-1 text-sm text-foreground-subtle">{hint}</p>
        )}
      </header>
      <div>{children}</div>
    </section>
  )
}

/* ---------- Palette ---------- */
const SCALE = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

function ColorRamp({
  name,
  prefix,
  note,
}: {
  name: string
  prefix: 'marine' | 'lime' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  note?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <h3 className="text-sm font-semibold text-foreground">{name}</h3>
        {note && <span className="text-xs text-foreground-subtle">{note}</span>}
      </div>
      <div className="grid grid-cols-11 gap-1 rounded-md overflow-hidden border border-border">
        {SCALE.map((s) => {
          const darkText = s <= 400
          return (
            <div
              key={s}
              // Inline var() — robuste vs scanner Tailwind pour classes dynamiques.
              style={{ backgroundColor: `var(--color-${prefix}-${s})` }}
              className={`${darkText ? 'text-foreground' : 'text-white'} h-14 flex flex-col items-center justify-center text-[10px] leading-tight`}
              title={`${prefix}-${s}`}
            >
              <span className="font-medium">{s}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectionPalette() {
  return (
    <Section
      id="palette"
      title="Palette de couleurs"
      hint="Marine (primaire) et lime (accent) sont extraits du logo officiel d’IT College. Sémantiques : success / warning / danger / info. Neutres légèrement bleutées pour s’harmoniser avec le marine."
    >
      <div className="grid gap-6">
        <ColorRamp name="Marine — primaire" prefix="marine" note="base = marine-600 (#3A3B92)" />
        <ColorRamp name="Lime — accent" prefix="lime" note="base = lime-400 (#BEDA58) — utiliser avec texte marine-900" />
        <ColorRamp name="Neutres" prefix="neutral" />
        <div className="grid md:grid-cols-2 gap-6">
          <ColorRamp name="Success" prefix="success" />
          <ColorRamp name="Warning" prefix="warning" />
          <ColorRamp name="Danger" prefix="danger" />
          <ColorRamp name="Info" prefix="info" />
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: 'background', cls: 'bg-background' },
            { label: 'surface',    cls: 'bg-surface border border-border' },
            { label: 'surface-muted', cls: 'bg-surface-muted' },
            { label: 'ring (focus)', cls: 'bg-marine-500' },
          ].map((t) => (
            <div key={t.label} className="rounded-md overflow-hidden border border-border">
              <div className={`h-16 ${t.cls}`} />
              <div className="px-3 py-2 text-xs flex items-center justify-between bg-white">
                <span className="font-medium text-foreground">{t.label}</span>
                <code className="text-foreground-subtle">surface</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

/* ---------- Typographie ---------- */
function SectionTypography() {
  const items = [
    { cls: 'text-5xl font-semibold', label: 'Display 5xl / 48' },
    { cls: 'text-4xl font-semibold', label: 'H1 4xl / 36' },
    { cls: 'text-3xl font-semibold', label: 'H2 3xl / 30' },
    { cls: 'text-2xl font-semibold', label: 'H3 2xl / 24' },
    { cls: 'text-xl font-medium', label: 'H4 xl / 20' },
    { cls: 'text-lg', label: 'Lead lg / 18' },
    { cls: 'text-base', label: 'Body base / 16' },
    { cls: 'text-sm', label: 'Small sm / 14' },
    { cls: 'text-xs', label: 'Caption xs / 12' },
  ]
  return (
    <Section
      id="typo"
      title="Typographie"
      hint="Police : Inter (variable). Choisie pour sa lisibilité dans les interfaces de gestion à forte densité d’information. Échelle modulaire avec ratio ≈ 1.2."
    >
      <div className="bg-surface border border-border rounded-lg divide-y divide-border">
        {items.map((i) => (
          <div key={i.label} className="flex items-baseline gap-6 px-5 py-3">
            <span className={`${i.cls} text-foreground flex-1`}>
              Catalogue · Arduino Uno R3
            </span>
            <span className="text-xs text-foreground-subtle font-mono w-40 text-right">
              {i.label}
            </span>
          </div>
        ))}
        <div className="px-5 py-3 flex items-baseline gap-6">
          <span className="text-base tabular-nums flex-1 text-foreground">
            12 000 Ar · 4 500 Ar · 380 000 Ar
          </span>
          <span className="text-xs text-foreground-subtle font-mono w-40 text-right">
            tabular-nums
          </span>
        </div>
      </div>
    </Section>
  )
}

/* ---------- Rayons & ombres ---------- */
function SectionRadiusShadow() {
  const radii = [
    { name: 'xs', cls: 'rounded-xs', desc: 'badge, tag' },
    { name: 'sm', cls: 'rounded-sm', desc: 'input, select' },
    { name: 'md', cls: 'rounded-md', desc: 'bouton' },
    { name: 'lg', cls: 'rounded-lg', desc: 'carte' },
    { name: 'xl', cls: 'rounded-xl', desc: 'modal' },
  ]
  const shadows = [
    { name: 'xs', cls: 'shadow-xs' },
    { name: 'sm', cls: 'shadow-sm' },
    { name: 'md', cls: 'shadow-md' },
    { name: 'lg', cls: 'shadow-lg' },
    { name: 'xl', cls: 'shadow-xl' },
  ]
  return (
    <Section id="radius-shadow" title="Rayons & élévation">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Rayons</h3>
          <div className="grid grid-cols-5 gap-3">
            {radii.map((r) => (
              <div key={r.name} className="text-center">
                <div className={`h-16 bg-marine-100 border border-marine-200 ${r.cls} mb-2`} />
                <div className="text-xs font-medium text-foreground">{r.name}</div>
                <div className="text-[11px] text-foreground-subtle">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Ombres (élévation)
          </h3>
          <div className="grid grid-cols-5 gap-3 p-4 bg-background rounded-lg">
            {shadows.map((s) => (
              <div key={s.name} className="text-center">
                <div className={`h-16 bg-white rounded-md ${s.cls} mb-2`} />
                <div className="text-xs font-medium text-foreground">{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ---------- Boutons ---------- */
function SectionButtons() {
  return (
    <Section
      id="buttons"
      title="Boutons"
      hint="Primaire = action principale (un seul par écran). Secondaire = action alternative. Discret = action tertiaire (annuler, lien dans une cellule). Danger = action destructive."
    >
      <div className="grid gap-6">
        {(['primary', 'secondary', 'ghost', 'danger'] as const).map((v) => (
          <div key={v} className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wide text-foreground-subtle w-24">
              {v}
            </span>
            <Button variant={v} size="sm">Petit</Button>
            <Button variant={v} size="md">Moyen</Button>
            <Button variant={v} size="lg">Large</Button>
            <Button variant={v} disabled>Désactivé</Button>
          </div>
        ))}

        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-border">
          <span className="text-xs font-mono uppercase tracking-wide text-foreground-subtle w-24">
            usage
          </span>
          <Button>Enregistrer l’achat</Button>
          <Button variant="secondary">Annuler</Button>
          <Button variant="ghost">Voir détails</Button>
          <Button variant="danger">Refuser la demande</Button>
        </div>
      </div>
    </Section>
  )
}

/* ---------- Champs ---------- */
function SectionFormFields() {
  return (
    <Section
      id="fields"
      title="Champs de saisie"
      hint="Tous les champs partagent la même hauteur (h-10) et le même focus ring marine. Erreur signalée via aria-invalid (bord + ring rouge)."
    >
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="f-quant" required>Quantité</Label>
              <Input id="f-quant" placeholder="ex. 10" type="number" />
              <FieldHint>Nombre d’unités à emprunter</FieldHint>
            </div>

            <div>
              <Label htmlFor="f-mat">Matériel</Label>
              <Select id="f-mat" defaultValue="">
                <option value="" disabled>Sélectionner un matériel</option>
                <option>Arduino Uno R3</option>
                <option>Câble jumper 20 cm</option>
                <option>Servo SG90</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="f-note">Note</Label>
              <Textarea id="f-note" placeholder="Précisions facultatives…" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="f-err" required>Email du responsable</Label>
              <Input id="f-err" defaultValue="pas-un-email" invalid />
              <FieldHint tone="error">Adresse e-mail invalide</FieldHint>
            </div>

            <div>
              <Label htmlFor="f-dis">Référence (lecture seule)</Label>
              <Input id="f-dis" defaultValue="EMP-2026-0042" disabled />
            </div>

            <div>
              <Label htmlFor="f-ok">Prix unitaire (Ar)</Label>
              <Input id="f-ok" defaultValue="12000" className="tabular-nums" />
              <FieldHint>Toujours en entier, sans séparateur</FieldHint>
            </div>
          </CardBody>
        </Card>
      </div>
    </Section>
  )
}

/* ---------- Badges ---------- */
function SectionBadges() {
  return (
    <Section
      id="badges"
      title="Badges & statuts"
      hint="Utiliser StatutBadge et EtatBadge pour les statuts métier — ne jamais composer manuellement (libellé + couleur centralisés)."
    >
      <div className="grid gap-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Statuts d’une demande
          </h3>
          <div className="flex gap-2 flex-wrap">
            <StatutBadge statut="demande" />
            <StatutBadge statut="valide" />
            <StatutBadge statut="refuse" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            État d’un emprunt
          </h3>
          <div className="flex gap-2 flex-wrap">
            <EtatBadge etat="en_cours" />
            <EtatBadge etat="rendu" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Tons disponibles (usage libre)
          </h3>
          <div className="flex gap-2 flex-wrap">
            <Badge tone="neutral">Neutre</Badge>
            <Badge tone="marine">Marine</Badge>
            <Badge tone="lime">Lime</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Danger</Badge>
            <Badge tone="info">Info</Badge>
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ---------- Cartes ---------- */
function SectionCards() {
  return (
    <Section
      id="cards"
      title="Cartes"
      hint="Conteneur standard pour bloc d’information ou de formulaire. Header / Body / Footer optionnels."
    >
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Arduino Uno R3</CardTitle>
              <CardDescription>Microcontrôleur · Durable</CardDescription>
            </div>
            <Badge tone="marine">12 en stock</Badge>
          </CardHeader>
          <CardBody className="text-sm text-foreground-muted">
            Carte de prototypage utilisée pour la majorité des projets robotique
            du labo. Trois paliers de prix actifs.
          </CardBody>
          <CardFooter>
            <Button variant="ghost" size="sm">Détails</Button>
            <Button size="sm">Emprunter</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Équipe Première · ALPHA</CardTitle>
              <CardDescription>4 emprunts en cours</CardDescription>
            </div>
            <StatutBadge statut="demande" />
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-foreground-subtle">Responsable</dt>
              <dd className="text-foreground">M. RAKOTO</dd>
              <dt className="text-foreground-subtle">Valeur détenue</dt>
              <dd className="text-foreground tabular-nums">156 000 Ar</dd>
              <dt className="text-foreground-subtle">Dernier emprunt</dt>
              <dd className="text-foreground">2026-06-07</dd>
            </dl>
          </CardBody>
          <CardFooter>
            <Button variant="danger" size="sm">Refuser</Button>
            <Button size="sm">Valider</Button>
          </CardFooter>
        </Card>
      </div>
    </Section>
  )
}

/* ---------- Tableau ---------- */
function SectionTable() {
  const rows = [
    { ref: 'EMP-0042', equipe: 'ALPHA · 1ère', materiel: 'Arduino Uno R3', qte: 4, prix: 48000, statut: 'demande' as const, etat: 'en_cours' as const },
    { ref: 'EMP-0041', equipe: 'BETA · 2nde',  materiel: 'Servo SG90',     qte: 6, prix: 27000, statut: 'valide'  as const, etat: 'en_cours' as const },
    { ref: 'EMP-0040', equipe: 'GAMMA · 2nde', materiel: 'Câble jumper',   qte: 20,prix: 6000,  statut: 'valide'  as const, etat: 'rendu'    as const },
    { ref: 'EMP-0039', equipe: 'DELTA · 2nde', materiel: 'Capteur HC-SR04',qte: 3, prix: 18000, statut: 'refuse'  as const, etat: 'en_cours' as const },
  ]
  return (
    <Section
      id="table"
      title="Tableau"
      hint="Pour les listes (emprunts, achats, catalogue). Lignes survolables, en-tête en majuscule espacée, prix en chiffres tabulaires."
    >
      <Table>
        <THead>
          <TR>
            <TH>Réf.</TH>
            <TH>Équipe</TH>
            <TH>Matériel</TH>
            <TH className="text-right">Qté</TH>
            <TH className="text-right">Valeur (Ar)</TH>
            <TH>Statut</TH>
            <TH>État</TH>
            <TH />
          </TR>
        </THead>
        <TBody>
          {rows.map((r) => (
            <TR key={r.ref}>
              <TD className="font-mono text-xs text-foreground">{r.ref}</TD>
              <TD className="font-medium text-foreground">{r.equipe}</TD>
              <TD>{r.materiel}</TD>
              <TD className="text-right tabular-nums">{r.qte}</TD>
              <TD className="text-right tabular-nums">
                {r.prix.toLocaleString('fr-FR').replace(/,/g, ' ')}
              </TD>
              <TD><StatutBadge statut={r.statut} /></TD>
              <TD><EtatBadge etat={r.etat} /></TD>
              <TD className="text-right">
                <Button variant="ghost" size="sm">Ouvrir</Button>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Section>
  )
}
