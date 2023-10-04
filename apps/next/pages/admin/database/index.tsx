import AdminPanel from 'app/features/admin'
import Head from 'next/head'
import { SSR } from 'common'
import { NextPageContext } from 'next'
import { API, redirect, withSession } from 'protolib'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router';
import { promises as fs } from 'fs';
import fsSync from 'fs'
import DBAdmin from 'app/features/admin/components/db'

const FileBrowser = dynamic(() => import('../../../components/FileBrowser'), {
  ssr: false,
})

export default function FilesPage({workspace, data}:any) {
  const router = useRouter();
  const { name } = router.query;
  return (
    <>
      <Head>
        <title>Protofy - Admin Panel</title>
      </Head>
      <AdminPanel workspace={workspace}>
        <DBAdmin currentDbState={data?.currentDbState} contentState={data?.contentState} />
      </AdminPanel>
    </>
  )
}

export const getServerSideProps = SSR(async (context:NextPageContext) => {
    const nameSegments = context.query.name as string[];
    
    let props = {}
    const dbs = await API.get('/adminapi/v1/databases') ?? { data: [] }


    if (!context.query.name && dbs.data.length) {
        return redirect('/admin/dbs/' + dbs.data[0].name)
    }

    const db = dbs.data.find((db:any) => db.name == nameSegments[0])
    if (!db) {
        return dbs.data.length ?
            redirect('/admin/dbs/' + dbs.data[0].name)
            :
            redirect('/admin')
    }
    props = {
      data: {
        contentState: dbs.data.length ? await API.get('/adminapi/v1/databases/' + db.name) : []
      }
    }

    return withSession(context, ['admin'], {
      ...props,
      workspace: await API.get('/adminapi/v1/workspaces')
    })
})
