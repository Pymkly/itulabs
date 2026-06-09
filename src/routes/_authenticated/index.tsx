import { createFileRoute } from '@tanstack/react-router'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  PageHeader,
} from '~/components/ui'
import { useSession } from '~/lib/auth/SessionContext'
import type { Role } from '~/lib/auth/session'

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
})

const ROLE_LABEL: Record<Role, string> = {
  super: 'Administrateur',
  responsable: 'Responsable',
  equipe: 'Équipe',
}

const ROLE_DESCRIPTION: Record<Role, string> = {
  super:
    'Vous gérez le catalogue, les achats, les équipes et validez toutes les demandes.',
  responsable:
    'Vous consultez tout le stock et validez les demandes d’emprunt et de retour. Les achats sont gérés par l’administrateur.',
  equipe:
    'Vous consultez le catalogue et faites des demandes d’emprunt et de retour pour votre équipe.',
}

// Tuiles "à venir" — affichées selon le rôle, pour matérialiser l'arborescence
// fonctionnelle sans encore construire les écrans métier.
const TILES_BY_ROLE: Record<Role, { title: string; desc: string }[]> = {
  super: [
    { title: 'Catalogue', desc: 'Matériels et paliers de prix' },
    { title: 'Achats', desc: 'Entrées de stock par achat' },
    { title: 'Équipes', desc: '12 équipes du hackathon' },
    { title: 'Emprunts', desc: 'Demandes et validations' },
    { title: 'Retours', desc: 'Suivi des restitutions' },
    { title: 'Stock', desc: 'État disponible + valeur' },
  ],
  responsable: [
    { title: 'Catalogue', desc: 'Matériels et paliers de prix' },
    { title: 'Emprunts', desc: 'Demandes à valider' },
    { title: 'Retours', desc: 'Restitutions à enregistrer' },
    { title: 'Stock', desc: 'État disponible + valeur' },
  ],
  equipe: [
    { title: 'Catalogue', desc: 'Matériels disponibles' },
    { title: 'Mes emprunts', desc: 'Faire et suivre mes demandes' },
    { title: 'Mes retours', desc: 'Restituer le matériel emprunté' },
  ],
}

function Home() {
  const { session } = useSession()
  const role = session.profil.role

  return (
    <>
      <PageHeader
        title={`Bonjour, ${session.user.email ?? 'invité'}`}
        description={ROLE_DESCRIPTION[role]}
        actions={
          <Badge
            tone={
              role === 'super'
                ? 'marine'
                : role === 'responsable'
                  ? 'info'
                  : 'lime'
            }
          >
            {ROLE_LABEL[role]}
          </Badge>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES_BY_ROLE[role].map((t) => (
          <Card key={t.title}>
            <CardHeader>
              <div>
                <CardTitle>{t.title}</CardTitle>
                <p className="text-sm text-foreground-subtle mt-0.5">
                  {t.desc}
                </p>
              </div>
              <Badge tone="neutral">Bientôt</Badge>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-foreground-subtle">
                Cet écran sera ajouté dans une prochaine étape.
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  )
}
