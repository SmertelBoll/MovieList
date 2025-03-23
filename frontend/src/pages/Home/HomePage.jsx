import { Box } from '@mui/material'
import React, { useEffect, useState } from 'react'
import ContainerCustom from '../../components/customMUI/ContainerCustom'
import SideBar from '../../components/SideBar/SideBar'
import GeneralMovieList from './GeneralMovieList'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios';
import { alertConfirm, alertError } from '../../alerts'


function HomePage() {
  const isAuth = useSelector(selectIsAuth);

  const [folders, setFolders] = useState([])                          // Папки
  const [curFolderToRename, setCurFolderToRename] = useState(false);  // order, якій папці міняємо назву
  const [curFolderName, setCurFolderName] = useState(false)           // значення в інпуті для папки, якій міняємо назву
  const [isGetFolders, setIsGetFolders] = useState(true)              // після видалення папки, у нас міняються order, тому треба новий запрос


  //-- GET -- //
  // Отримати назви папок
  useEffect(() => {
    if (isGetFolders && isAuth) {
      instance
        .get(`/folders`)
        .then((res) => {
          setFolders(res.data)

        })
        .catch((err) => {
          console.warn(err);
          alertError(err);
        });
      setIsGetFolders(false)
    }
  }, [isGetFolders, isAuth]);

  //-- ADD -- //
  // Додаємо нову папку
  const handleAddFolder = () => {
    if (!curFolderToRename) {
      const timestamp = Date.now();
      const newFolderName = `${timestamp}`; // Назва нової папки

      instance
        .post(`/folders/create`, { name: newFolderName })
        .then((res) => {
          setFolders(prev => [...prev, res.data])
          setCurFolderToRename(res.data.order)
          setCurFolderName("folder")
        })
        .catch((err) => {
          console.warn(err);
          alertError(err);
        });
    }
  }

  //-- RENAME -- //
  // Натиснуто кнопку rename в панелі вибору дій. Перетворюємо папку на input
  const handleClickRename = (order, name) => {
    setCurFolderToRename(order)
    setCurFolderName(name)
  }

  // Відслідковує input при зміні назви папки
  const handleInputChange = (event) => {
    const { _, value } = event.target;
    setCurFolderName(value);
  };

  // Міняє назву папки у базі даних, оновлюємо state
  const handleUpdateFolderName = (order, newFolderName) => {
    instance
      .patch(`/folders/rename/${order}`, { name: newFolderName })
      .then((res) => {
        setFolders((prevFolders) =>
          [...prevFolders.filter((folder) => folder.order !== order), res.data]
        );
        setCurFolderToRename(false)
        setCurFolderName(false)
      })
      .catch((err) => {
        console.warn(err);
        console.log(err)
        alertError(err);
      });
  };

  //-- DELETE -- //
  // Натиснуто кнопку delete в панелі вибору дій. Запитуємо чи користувач впевнений
  const handleClickDelete = (order) => {
    alertConfirm("Are you sure?", () => deleteFolder(order));
  };

  // Видалення папки
  const deleteFolder = (order) => {
    instance
      .delete(`/folders/${order}`)
      .then((res) => {
        setFolders((prevFolders) =>
          prevFolders.filter((folder) => folder.order !== order)
        );
        setIsGetFolders(true)

      })
      .catch((err) => {
        console.warn(err);
        alertError(err);
      });
  }

  //-- CHANGE ORDER -- //
  // Перемістити вверх по черзі
  const handleIncrementOrder = (order) => {
    instance
      .patch(`/folders/orderIncrement/${order}`)
      .then((res) => {
        if (res.data.success) { setIsGetFolders(true) }
      })
      .catch((err) => {
        console.warn(err);
        alertError(err);
      });
  }

  // Перемістити вниз по черзі
  const handleDecrementOrder = (order) => {
    instance
      .patch(`/folders/orderDecrement/${order}`)
      .then((res) => {
        if (res.data.success) setIsGetFolders(true)
      })
      .catch((err) => {
        console.warn(err);
        alertError(err);
      });
  }


  return (
    <ContainerCustom paddingY bgcolor="bg.main" sx={{ display: "flex", gap: 3, width: "100%" }}>
      {isAuth
        ? <Box sx={{ flexBasis: "30%", flexGrow: 1, maxWidth: "280px" }}>
          <SideBar
            folders={folders}
            curFolderName={curFolderName}
            curFolderToRename={curFolderToRename}
            handleAddFolder={handleAddFolder}
            handleClickRename={handleClickRename}
            handleInputChange={handleInputChange}
            handleUpdateFolderName={handleUpdateFolderName}
            handleClickDelete={handleClickDelete}
            handleIncrementOrder={handleIncrementOrder}
            handleDecrementOrder={handleDecrementOrder}


          />
        </Box>
        : null
      }

      <Box sx={{ flexBasis: isAuth ? "70%" : "100%", flexGrow: 1 }}>
        <GeneralMovieList
          folders={folders}
          curFolderName={curFolderName}
          curFolderToRename={curFolderToRename}
          handleUpdateFolderName={handleUpdateFolderName}
          handleInputChange={handleInputChange}
          handleAddFolder={handleAddFolder}
          setCurFolderName={setCurFolderName}
          setCurFolderToRename={setCurFolderToRename}
        />
      </Box>
    </ContainerCustom>
  )
}

export default HomePage