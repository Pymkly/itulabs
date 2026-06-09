import { Link, createFileRoute } from '@tanstack/react-router'
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

// `to` rend la tuile cliquable et enlève le badge « Bientôt » : on l'ajoute
// au fur et à mesure que les écrans correspondants sont livrés.
type Tile = { title: string; desc: string; to?: '/catalogue' }

const TILES_BY_ROLE: Record<Role, Tile[]> = {
  super: [
    { title: 'Catalogue', desc: 'Matériels et paliers de prix', to: '/catalogue' },
    { title: 'Achats', desc: 'Entrées de stock par achat' },
    { title: 'Équipes', desc: '12 équipes du hackathon' },
    { title: 'Emprunts', desc: 'Demandes et validations' },
    { title: 'Retours', desc: 'Suivi des restitutions' },
    { title: 'Stock', desc: 'État disponible + valeur' },
  ],
  responsable: [
    { title: 'Catalogue', desc: 'Matériels et paliers de prix', to: '/catalogue' },
    { title: 'Emprunts', desc: 'Demandes à valider' },
    { title: 'Retours', desc: 'Restitutions à enregistrer' },
    { title: 'Stock', desc: 'État disponible + valeur' },
  ],
  equipe: [
    { title: 'Catalogue', desc: 'Matériels disponibles', to: '/catalogue' },
    { title: 'Mes emprunts', desc: 'Faire et suivre mes demandes' },
    { title: 'Mes retours', desc: 'Restituer le matériel emprunté' },
  ],
}

function Home() {
  const { session } = useSession()
  const role = session.profil.role

  const emailLocal = session.user.email?.split('@')[0]

  return (
    <>
      <PageHeader
        title={emailLocal ? `Bonjour, ${emailLocal}` : 'Tableau de bord'}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES_BY_ROLE[role].map((t) =>
          t.to ? (
            <Link key={t.title} to={t.to} className="block group">
              <Card className="transition-shadow group-hover:shadow-md group-hover:border-marine-300">
                <CardHeader>
                  <div>
                    <CardTitle>{t.title}</CardTitle>
                    <p className="text-sm text-foreground-subtle mt-0.5">
                      {t.desc}
                    </p>
                  </div>
                  <Badge tone="marine">Ouvrir</Badge>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-foreground-subtle">
                    Accéder à l’écran.
                  </p>
                </CardBody>
              </Card>
            </Link>
          ) : (
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
          ),
        )}
      </div>
    </>
  )
}
