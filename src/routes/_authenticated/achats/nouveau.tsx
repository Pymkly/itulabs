import * as React from 'react'
import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
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
  Textarea,
} from '~/components/ui'
import { useSession } from '~/lib/auth/SessionContext'
import {
  createResponsable,
  enregistrerAchat,
  getResponsables,
  type Responsable,
} from '~/lib/achats/server'
import { getCatalogue, type Materiel, type Palier } from '~/lib/catalogue/server'

export const Route = createFileRoute('/_authenticated/achats/nouveau')({
  beforeLoad: ({ context }) => {
    if (context.session.profil.role !== 'super') {
      throw redirect({ to: '/' })
    }
  },
  loader: async () => {
    const [catalogue, responsables] = await Promise.all([
      getCatalogue(),
      getResponsables(),
    ])
    return { catalogue, responsables }
  },
  component: NouvelAchatPage,
})

interface LigneForm {
  key: string
  materielId: string
  mode: 'existant' | 'nouveau'
  palierId: string
  prixUnitaire: string
  quantite: string
}

let LIGNE_SEQ = 0
function newLigne(): LigneForm {
  return {
    key: `l${++LIGNE_SEQ}`,
    materielId: '',
    mode: 'existant',
    palierId: '',
    prixUnitaire: '',
    quantite: '',
  }
}

function NouvelAchatPage() {
  const { catalogue, responsables: initialResponsables } = Route.useLoaderData()
  const { session } = useSession()
  const navigate = useNavigate()
  const router = useRouter()
  const submit = useServerFn(enregistrerAchat)

  const paliersByMateriel = React.useMemo(() => {
    const m = new Map<string, Palier[]>()
    for (const p of catalogue.paliers) {
      if (!m.has(p.materiel_id)) m.set(p.materiel_id, [])
      m.get(p.materiel_id)!.push(p)
    }
    return m
  }, [catalogue.paliers])

  const today = new Date().toISOString().slice(0, 10)

  const [fournisseur, setFournisseur] = React.useState('')
  const [dateAchat, setDateAchat] = React.useState(today)
  const [responsables, setResponsables] = React.useState<Responsable[]>(initialResponsables)
  const [responsableId, setResponsableId] = React.useState<string>(
    session.profil.responsable_id ??
      initialResponsables[0]?.id ??
      '',
  )
  const [notes, setNotes] = React.useState('')
  const [lignes, setLignes] = React.useState<LigneForm[]>([newLigne()])
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [newResponsableOpen, setNewResponsableOpen] = React.useState(false)

  function updateLigne(idx: number, patch: Partial<LigneForm>) {
    setLignes((curr) => curr.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }
  function removeLigne(idx: number) {
    setLignes((curr) => (curr.length > 1 ? curr.filter((_, i) => i !== idx) : curr))
  }
  function addLigne() {
    setLignes((curr) => [...curr, newLigne()])
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const payload = {
        fournisseur,
        date_achat: dateAchat,
        responsable_id: responsableId || null,
        notes,
        lignes: lignes.map((l) => ({
          materiel_id: l.materielId,
          quantite: l.quantite,
          palier_id: l.mode === 'existant' ? l.palierId : null,
          prix_unitaire: l.mode === 'nouveau' ? l.prixUnitaire : null,
        })),
      }
      const { achatId } = await submit({ data: payload })
      await router.invalidate()
      navigate({ to: '/achats', replace: true })
      // achatId est dispo si on veut l'utiliser plus tard (lien direct).
      void achatId
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleResponsableCreated(r: Responsable) {
    setResponsables((curr) => [...curr, r].sort((a, b) => a.nom.localeCompare(b.nom)))
    setResponsableId(r.id)
    setNewResponsableOpen(false)
  }

  // total estimé pour info (pas envoyé au serveur ; le serveur recalcule)
  const totalEstime = lignes.reduce((sum, l) => {
    const qte = Number(l.quantite) || 0
    let prix = 0
    if (l.mode === 'existant' && l.palierId) {
      const p = catalogue.paliers.find((pp) => pp.id === l.palierId)
      prix = p?.prix_unitaire ?? 0
    } else if (l.mode === 'nouveau') {
      prix = Number(l.prixUnitaire) || 0
    }
    return sum + qte * prix
  }, 0)

  return (
    <>
      <PageHeader
        title="Nouvel achat"
        description="Une fois enregistré, l’achat génère un mouvement d’entrée par ligne et fait monter le stock."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate({ to: '/achats' })}
          >
            Annuler
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="space-y-6">
        {/* -------- En-tête -------- */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Détails de l’achat</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ach-date" required>
                Date d’achat
              </Label>
              <Input
                id="ach-date"
                type="date"
                value={dateAchat}
                onChange={(e) => setDateAchat(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ach-resp" required>
                Responsable
              </Label>
              <div className="flex gap-2">
                <Select
                  id="ach-resp"
                  value={responsableId}
                  onChange={(e) => setResponsableId(e.target.value)}
                  required
                  disabled={responsables.length === 0}
                  className="flex-1"
                >
                  {responsables.length === 0 && (
                    <option value="">Aucun responsable enregistré</option>
                  )}
                  {responsables.length > 0 && responsableId === '' && (
                    <option value="" disabled>
                      Sélectionner…
                    </option>
                  )}
                  {responsables.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nom}
                      {r.role ? ` · ${r.role}` : ''}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setNewResponsableOpen(true)}
                >
                  Nouveau
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="ach-four">Fournisseur</Label>
              <Input
                id="ach-four"
                value={fournisseur}
                onChange={(e) => setFournisseur(e.target.value)}
                placeholder="ex. Robotique Mada"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ach-notes">Note</Label>
              <Textarea
                id="ach-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Précisions facultatives (n° facture, contexte…)"
              />
            </div>
          </div>
        </div>

        {/* -------- Lignes -------- */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Lignes d’achat</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addLigne}>
              + Ajouter une ligne
            </Button>
          </div>

          <div className="space-y-3">
            {lignes.map((l, idx) => (
              <LigneAchatRow
                key={l.key}
                index={idx}
                ligne={l}
                materiels={catalogue.materiels}
                paliersDuMateriel={paliersByMateriel.get(l.materielId) ?? []}
                onChange={(patch) => updateLigne(idx, patch)}
                onRemove={() => removeLigne(idx)}
                removable={lignes.length > 1}
              />
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-foreground-subtle">Total estimé</span>
            <span className="text-base font-semibold text-foreground tabular-nums">
              {totalEstime.toLocaleString('fr-FR').replace(/[  ]/g, ' ')} Ar
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-sm border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700"
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate({ to: '/achats' })}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Enregistrer l’achat'}
          </Button>
        </div>
      </form>

      {newResponsableOpen && (
        <NewResponsableModal
          onClose={() => setNewResponsableOpen(false)}
          onCreated={handleResponsableCreated}
        />
      )}
    </>
  )
}

/* ---------------- Une ligne ---------------- */

function LigneAchatRow({
  index,
  ligne,
  materiels,
  paliersDuMateriel,
  onChange,
  onRemove,
  removable,
}: {
  index: number
  ligne: LigneForm
  materiels: Materiel[]
  paliersDuMateriel: Palier[]
  onChange: (patch: Partial<LigneForm>) => void
  onRemove: () => void
  removable: boolean
}) {
  return (
    <div className="rounded-md border border-border bg-neutral-50/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground-subtle uppercase tracking-wide">
          Ligne {index + 1}
        </span>
        {removable && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={`Supprimer la ligne ${index + 1}`}
          >
            Supprimer
          </Button>
        )}
      </div>
      <div className="grid md:grid-cols-12 gap-3 items-start">
        <div className="md:col-span-5">
          <Label htmlFor={`mat-${ligne.key}`} required>
            Matériel
          </Label>
          <Select
            id={`mat-${ligne.key}`}
            value={ligne.materielId}
            onChange={(e) =>
              onChange({
                materielId: e.target.value,
                palierId: '', // réinitialise le palier quand on change de matériel
                prixUnitaire: '',
              })
            }
            required
          >
            <option value="" disabled>
              Sélectionner un matériel…
            </option>
            {materiels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
                {m.categorie ? ` · ${m.categorie}` : ''}
              </option>
            ))}
          </Select>
        </div>

        <div className="md:col-span-5">
          <Label required>Palier de prix</Label>
          <div className="flex gap-2 mb-2 text-xs">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name={`mode-${ligne.key}`}
                value="existant"
                checked={ligne.mode === 'existant'}
                onChange={() => onChange({ mode: 'existant', prixUnitaire: '' })}
                disabled={!ligne.materielId || paliersDuMateriel.length === 0}
              />
              <span>Palier existant</span>
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name={`mode-${ligne.key}`}
                value="nouveau"
                checked={ligne.mode === 'nouveau'}
                onChange={() => onChange({ mode: 'nouveau', palierId: '' })}
              />
              <span>Nouveau prix</span>
            </label>
          </div>
          {ligne.mode === 'existant' ? (
            <Select
              value={ligne.palierId}
              onChange={(e) => onChange({ palierId: e.target.value })}
              disabled={!ligne.materielId || paliersDuMateriel.length === 0}
              required
            >
              <option value="" disabled>
                {paliersDuMateriel.length === 0
                  ? 'Aucun palier — saisir un nouveau prix'
                  : 'Sélectionner un palier…'}
              </option>
              {paliersDuMateriel.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.prix_unitaire.toLocaleString('fr-FR').replace(/[  ]/g, ' ')} Ar
                </option>
              ))}
            </Select>
          ) : (
            <Input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={ligne.prixUnitaire}
              onChange={(e) => onChange({ prixUnitaire: e.target.value })}
              placeholder="Prix unitaire en Ar"
              className="tabular-nums"
              required
            />
          )}
          {ligne.mode === 'nouveau' && (
            <FieldHint>
              Si ce prix existe déjà pour ce matériel, le palier existant est réutilisé.
            </FieldHint>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor={`qte-${ligne.key}`} required>
            Quantité
          </Label>
          <Input
            id={`qte-${ligne.key}`}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={ligne.quantite}
            onChange={(e) => onChange({ quantite: e.target.value })}
            className="tabular-nums"
            required
          />
        </div>
      </div>
    </div>
  )
}

/* ---------------- Modale Nouveau responsable ---------------- */

function NewResponsableModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (r: Responsable) => void
}) {
  const create = useServerFn(createResponsable)
  const [nom, setNom] = React.useState('')
  const [role, setRole] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const r = await create({ data: { nom, role } })
      onCreated(r)
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
      title="Nouveau responsable"
      description="Ajoutez un responsable du laboratoire."
    >
      <form onSubmit={onSubmit}>
        <ModalBody className="space-y-4">
          <div>
            <Label htmlFor="resp-nom" required>
              Nom
            </Label>
            <Input
              id="resp-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              autoFocus
              placeholder="ex. M. RAKOTO"
            />
          </div>
          <div>
            <Label htmlFor="resp-role">Fonction</Label>
            <Input
              id="resp-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="ex. Enseignant robotique"
            />
            <FieldHint>Facultatif.</FieldHint>
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
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? '…' : 'Créer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
