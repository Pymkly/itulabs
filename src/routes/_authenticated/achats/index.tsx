import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  Badge,
  Button,
  PageHeader,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from '~/components/ui'
import { getAchats, type AchatRow } from '~/lib/achats/server'

export const Route = createFileRoute('/_authenticated/achats/')({
  beforeLoad: ({ context }) => {
    if (context.session.profil.role !== 'super') {
      throw redirect({ to: '/' })
    }
  },
  loader: () => getAchats(),
  component: AchatsListePage,
})

function formatAr(n: number): string {
  return n.toLocaleString('fr-FR').replace(/[  ]/g, ' ')
}

function formatDate(iso: string): string {
  // iso = 'YYYY-MM-DD' → DD/MM/YYYY
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function AchatsListePage() {
  const achats = Route.useLoaderData() as AchatRow[]

  return (
    <>
      <PageHeader
        title="Achats"
        description="Enregistrez les entrées de stock par achat. Chaque achat génère un mouvement d’entrée par ligne."
        actions={
          <Link to="/achats/nouveau">
            <Button size="sm">Nouvel achat</Button>
          </Link>
        }
      />

      {achats.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg px-6 py-12 text-center">
          <p className="text-foreground font-medium">Aucun achat enregistré.</p>
          <p className="text-sm text-foreground-subtle mt-1 mb-4">
            Enregistrez la première arrivée de matériel pour amorcer le stock.
          </p>
          <Link to="/achats/nouveau">
            <Button>Nouvel achat</Button>
          </Link>
        </div>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Date</TH>
              <TH>Fournisseur</TH>
              <TH>Responsable</TH>
              <TH className="text-right">Lignes</TH>
              <TH className="text-right">Valeur (Ar)</TH>
              <TH>Note</TH>
            </TR>
          </THead>
          <TBody>
            {achats.map((a) => (
              <TR key={a.id}>
                <TD className="tabular-nums">{formatDate(a.date_achat)}</TD>
                <TD className="font-medium text-foreground">
                  {a.fournisseur ?? <em className="text-foreground-subtle font-normal">—</em>}
                </TD>
                <TD>
                  {a.responsable_nom ? (
                    <Badge tone="marine">{a.responsable_nom}</Badge>
                  ) : (
                    <em className="text-foreground-subtle">—</em>
                  )}
                </TD>
                <TD className="text-right tabular-nums">{a.nb_lignes}</TD>
                <TD className="text-right tabular-nums">{formatAr(a.valeur_totale)}</TD>
                <TD className="text-foreground-subtle text-xs max-w-xs truncate">
                  {a.notes ?? ''}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  )
}
