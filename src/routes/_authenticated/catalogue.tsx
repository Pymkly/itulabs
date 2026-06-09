import * as React from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  Badge,
  Button,
  FieldHint,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  PageHeader,
  Select,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from '~/components/ui'
import {
  createMateriel,
  createPalier,
  getCatalogue,
  updateMateriel,
  type Materiel,
  type Palier,
  type StockLigne,
  type TypeMateriel,
} from '~/lib/catalogue/server'
import { useSession } from '~/lib/auth/SessionContext'

export const Route = createFileRoute('/_authenticated/catalogue')({
  loader: () => getCatalogue(),
  component: CataloguePage,
})

function formatAr(n: number): string {
  return n.toLocaleString('fr-FR').replace(/ |,/g, ' ')
}

function CataloguePage() {
  const data = Route.useLoaderData()
  const { session } = useSession()
  const isSuper = session.profil.role === 'super'

  // dialog state
  const [creating, setCreating] = React.useState(false)
  const [editing, setEditing] = React.useState<Materiel | null>(null)
  const [paliersOf, setPaliersOf] = React.useState<Materiel | null>(null)

  // index paliers + stock par matériel pour rendre la table efficace
  const paliersByMateriel = React.useMemo(() => {
    const m = new Map<string, Palier[]>()
    for (const p of data.paliers) {
      if (!m.has(p.materiel_id)) m.set(p.materiel_id, [])
      m.get(p.materiel_id)!.push(p)
    }
    return m
  }, [data.paliers])

  const stockByMateriel = React.useMemo(() => {
    const m = new Map<string, number>()
    for (const s of data.stock) {
      m.set(s.materiel_id, (m.get(s.materiel_id) ?? 0) + s.quantite_disponible)
    }
    return m
  }, [data.stock])

  return (
    <>
      <PageHeader
        title="Catalogue"
        description={
          isSuper
            ? 'Gérez les matériels du laboratoire et leurs paliers de prix unitaires.'
            : 'Consultez les matériels du laboratoire, leurs paliers de prix et le stock disponible.'
        }
        actions={
          isSuper && (
            <Button onClick={() => setCreating(true)} size="sm">
              Nouveau matériel
            </Button>
          )
        }
      />

      {data.materiels.length === 0 ? (
        <EmptyState isSuper={isSuper} onCreate={() => setCreating(true)} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Nom</TH>
              <TH>Catégorie</TH>
              <TH>Type</TH>
              <TH>Paliers de prix (Ar)</TH>
              <TH className="text-right">Stock disponible</TH>
              {isSuper && <TH className="text-right">Actions</TH>}
            </TR>
          </THead>
          <TBody>
            {data.materiels.map((m) => {
              const paliers = paliersByMateriel.get(m.id) ?? []
              const stock = stockByMateriel.get(m.id) ?? 0
              return (
                <TR key={m.id}>
                  <TD className="font-medium text-foreground">{m.nom}</TD>
                  <TD>{m.categorie ?? <em className="text-foreground-subtle">—</em>}</TD>
                  <TD>
                    <Badge tone={m.type === 'durable' ? 'marine' : 'lime'}>
                      {m.type === 'durable' ? 'Durable' : 'Consommable'}
                    </Badge>
                  </TD>
                  <TD>
                    {paliers.length === 0 ? (
                      <span className="text-foreground-subtle italic">
                        Aucun palier
                      </span>
                    ) : (
                      <span className="tabular-nums">
                        {paliers.map((p) => formatAr(p.prix_unitaire)).join(' · ')}
                      </span>
                    )}
                  </TD>
                  <TD className="text-right tabular-nums">{stock}</TD>
                  {isSuper && (
                    <TD className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPaliersOf(m)}
                        >
                          Paliers
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(m)}
                        >
                          Modifier
                        </Button>
                      </div>
                    </TD>
                  )}
                </TR>
              )
            })}
          </TBody>
        </Table>
      )}

      {creating && (
        <MaterielFormModal
          mode="create"
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <MaterielFormModal
          mode="edit"
          materiel={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {paliersOf && (
        <PaliersModal
          materiel={paliersOf}
          paliers={paliersByMateriel.get(paliersOf.id) ?? []}
          stock={data.stock.filter((s) => s.materiel_id === paliersOf.id)}
          onClose={() => setPaliersOf(null)}
        />
      )}
    </>
  )
}

function EmptyState({
  isSuper,
  onCreate,
}: {
  isSuper: boolean
  onCreate: () => void
}) {
  return (
    <div className="bg-surface border border-border rounded-lg px-6 py-12 text-center">
      <p className="text-foreground font-medium">Aucun matériel pour l’instant.</p>
      <p className="text-sm text-foreground-subtle mt-1 mb-4">
        {isSuper
          ? 'Ajoutez votre premier matériel pour démarrer le catalogue.'
          : 'L’administrateur n’a pas encore ajouté de matériel.'}
      </p>
      {isSuper && <Button onClick={onCreate}>Nouveau matériel</Button>}
    </div>
  )
}

/* ---------------- Formulaire matériel (create + edit) ---------------- */

function MaterielFormModal(
  props:
    | { mode: 'create'; onClose: () => void }
    | { mode: 'edit'; materiel: Materiel; onClose: () => void },
) {
  const router = useRouter()
  const create = useServerFn(createMateriel)
  const update = useServerFn(updateMateriel)
  const initial =
    props.mode === 'edit'
      ? props.materiel
      : { id: '', nom: '', categorie: null, type: 'durable' as TypeMateriel }

  const [nom, setNom] = React.useState(initial.nom)
  const [categorie, setCategorie] = React.useState(initial.categorie ?? '')
  const [type, setType] = React.useState<TypeMateriel>(initial.type)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (props.mode === 'create') {
        await create({ data: { nom, categorie, type } })
      } else {
        await update({
          data: { id: props.materiel.id, nom, categorie, type },
        })
      }
      await router.invalidate()
      props.onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={props.onClose}
      title={
        props.mode === 'create' ? 'Nouveau matériel' : 'Modifier le matériel'
      }
      description={
        props.mode === 'create'
          ? 'Ajoutez un matériel au catalogue.'
          : `Modifiez « ${props.materiel.nom} ».`
      }
    >
      <form onSubmit={onSubmit}>
        <ModalBody className="space-y-4">
          <div>
            <Label htmlFor="mat-nom" required>
              Nom
            </Label>
            <Input
              id="mat-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              autoFocus
              placeholder="ex. Arduino Uno R3"
            />
          </div>

          <div>
            <Label htmlFor="mat-categorie">Catégorie</Label>
            <Input
              id="mat-categorie"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              placeholder="ex. Microcontrôleur"
            />
            <FieldHint>Facultatif — pour regrouper les matériels.</FieldHint>
          </div>

          <div>
            <Label htmlFor="mat-type" required>
              Type
            </Label>
            <Select
              id="mat-type"
              value={type}
              onChange={(e) => setType(e.target.value as TypeMateriel)}
            >
              <option value="durable">Durable</option>
              <option value="consommable">Consommable</option>
            </Select>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-sm border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700"
            >
              {error}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={props.onClose}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting
              ? 'Enregistrement…'
              : props.mode === 'create'
                ? 'Créer'
                : 'Enregistrer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

/* ---------------- Modale Paliers (lecture + ajout) ---------------- */

function PaliersModal({
  materiel,
  paliers,
  stock,
  onClose,
}: {
  materiel: Materiel
  paliers: Palier[]
  stock: StockLigne[]
  onClose: () => void
}) {
  const router = useRouter()
  const addPalier = useServerFn(createPalier)
  const [prix, setPrix] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [info, setInfo] = React.useState<string | null>(null)

  const stockById = new Map(stock.map((s) => [s.materiel_pu_id, s]))

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      const result = await addPalier({
        data: { materielId: materiel.id, prixUnitaire: prix },
      })
      if (result.reused) {
        setInfo(
          `Le palier à ${formatAr(result.palier.prix_unitaire)} Ar existait déjà — réutilisé.`,
        )
      } else {
        setInfo(`Palier à ${formatAr(result.palier.prix_unitaire)} Ar créé.`)
      }
      setPrix('')
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Paliers de prix — ${materiel.nom}`}
      description="Un seul palier par valeur de prix. Réutilisé automatiquement si le prix existe déjà."
      size="lg"
    >
      <ModalBody>
        {paliers.length === 0 ? (
          <p className="text-sm text-foreground-subtle">
            Aucun palier pour ce matériel.
          </p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH className="text-right">Prix unitaire (Ar)</TH>
                <TH className="text-right">Stock disponible</TH>
                <TH className="text-right">Valeur (Ar)</TH>
              </TR>
            </THead>
            <TBody>
              {paliers.map((p) => {
                const s = stockById.get(p.id)
                return (
                  <TR key={p.id}>
                    <TD className="text-right tabular-nums font-medium text-foreground">
                      {formatAr(p.prix_unitaire)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {s?.quantite_disponible ?? 0}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatAr(s?.valeur_disponible ?? 0)}
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}

        <form onSubmit={onAdd} className="mt-5 border-t border-border pt-4">
          <Label htmlFor="palier-prix" required>
            Ajouter un palier
          </Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              id="palier-prix"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              placeholder="Prix unitaire en Ariary"
              className="tabular-nums"
              required
            />
            <Button type="submit" size="md" disabled={submitting}>
              {submitting ? '…' : 'Ajouter'}
            </Button>
          </div>
          <FieldHint>Entier positif, en Ariary. Pas de séparateur.</FieldHint>

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-sm border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700"
            >
              {error}
            </div>
          )}
          {info && !error && (
            <div
              role="status"
              className="mt-3 rounded-sm border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-800"
            >
              {info}
            </div>
          )}
        </form>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Fermer
        </Button>
      </ModalFooter>
    </Modal>
  )
}
