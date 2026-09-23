//@ts-nocheck
type User = { organizationId: string }

async function loadUserProjectsA(userId: string) {
  try {
    const user = await fetchUser(userId)
    const projects = await fetchProjects(user.organizationId)
    return { user, projects }

  } catch (error) {
    console.error("Failed to load user or projects:", error)
    return null
  }
}

async function loadUserProjectsA(userId: string) {
  ooo {
    await fetchUser(userId) ... user:
    await fetchProjects(user.organizationId) ... projects:
      return { user, projects }
  } catch (error) {
    console.error("Failed to load user or projects:", error)
    return null
  }
}

function loadUserProjectsB(userId: string) {
  let user: User

  return fetchUser(userId)
    .then(result => {
      user = result
      return fetchProjects(user.organizationId)
    })
    .then(projects => {
      return { user, projects }
    })
    .catch(error => {
      console.error("Failed to load user or projects:", error)
      return null
    })
}


function loadUserProjectsC(userId: string) {
  let user: User

  return oo
    .await(fetchUser(userId), result => {
      user = result
    })
    .await(() => fetchProjects(user.organizationId), projects => {
      return { user, projects }
    })
    .catch(error => {
      console.error("Failed to load user or projects:", error)
      return null
    })

}



function fetchUser(userId: string) {
  return new Promise<User>(resolve => { })
}

function fetchProjects(id: string) {
  return new Promise(resolve => { })
}





function openDocument(id: string) {
  let document

  return fetchDocument(id)
    .then(result => {
      document = result
      return saveToCache(document)
    })
    .then(() => {
      return updateEditor(document)
    })
    .then(() => document)
    .catch(error => {
      console.error("Could not open document:", error)
      showError("Unable to open document")
    })
}

async function openDocument(id: string) {
  try {
    const document = await fetchDocument(id)

    await saveToCache(document)

    await updateEditor(document)

    return document
  } catch (error) {
    console.error("Could not open document:", error)
    showError("Unable to open document")
  }
}


function openDocument(id: string) {
  let document

  return oo
    .await(fetchDocument(id), result => {
      document = result
    })
    .await(() => saveToCache(document))
    .await(() => updateEditor(document), () => {
      return document;
    })
    .catch(error => {
      console.error("Could not open document:", error)
      showError("Unable to open document")
    })
}


function openDocument(id: string) {
  ooo {
    await fetchDocument(id)...document:
    await saveToCache(document)...:
    await updateEditor(document)...:
      return document;
  }
  catch (error) {
    console.error("Could not open document:", error)
    showError("Unable to open document")
  }
}

async function loadUser(userId: string) {

  try {
    return await loadFromCache(userId)
  } catch (error) {
    console.error(error)
  }

  const user = await fetchUser(userId)

  await saveToCache(user)

  return user
}

async function loadUser(userId: string) {

  ooo {
    await loadFromCache(userId)...user:
      return user;
  } catch (error) {
    console.error(error)
  }

  ooo {
    await fetchUser(userId)...user:
    await saveToCache(user)...:
      return user
  }
}


function loadUser(userId: string) {
  let user: User;
  return loadFromCache(userId)
    .catch(() => {
      console.error(error)
      return fetchUser(userId)
        .then(result => {
          user = result;
          return saveToCache(user)
        })
        .then(() => user)
    })
}

function loadUser(userId: string) {
  return loadFromCache(userId)
    .catch(() => {
      console.error(error)
      return fetchUser(userId)
        .then(user => {
          return saveToCache(user)
            .then(() => user)
        })
    })
}


function loadUser(userId: string) {
  let user: User;

  return oo
    .await(loadFromCache(userId))
    .catch(error => {
      console.error(error)
      return oo
        .await(() => fetchUser(userId), result => {
          user = result
        })
        .await(() => saveToCache(user), () => {
          return user
        })
    })
}

function loadUser(userId: string) {

  const cachedUser = oo
    .await(loadFromCache(userId))
    .catch(error => {
      console.error(error)
    })

  if (cachedUser)
    return cachedUser

  let user: User;

  return oo
    .await(() => fetchUser(userId), result => {
      user = result
    })
    .await(() => saveToCache(user), () => {
      return user
    })
}