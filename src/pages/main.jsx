import React from "react";
import {
    Box,
    Container,
    Typography
} from '@mui/material';
import { Navigate } from "react-router-dom";

import TabContext from '@mui/lab/TabContext';
import TabPanelTodo from '../components/tabPanelTodo';

import TabListCalendar from "../components/tabListCalendar";

var container = {
    position: 'absolute',
    width: "50%",
    left: '50%',
    transform: 'translate(-50%, -0%)',
};

//Метод объединяет все обьекты одного дня в один.
function getFormatData(data) {
    const trueNumberServings = getNumberServings(data);
    let formatData = [];
    let box = [];
    let countDay = 0;

    //Массив формируется следующим образом =>
    //В каждой ячейче(box) по trueNumberServings массива.
    //Каждая ячейка олицетворяет один день.
    for (let i = 0; i < data.length; i++) {
        box[data[i].servingNumber - 1] = data[i];
        box[data[i].servingNumber - 1].backColor = getBackColor(data[i]);
        if (data[i].servingNumber === trueNumberServings) {
            formatData[countDay] = box;
            box = [];

            countDay++;
        }
    }

    return formatData;
}

//Возвращает количество порций в день.
function getNumberServings(data) {
    //Вряд-ли коту нужно будет давать больше 10 порций в день.
    const estimatedNumberServings = 10;
    let max = 0;
    for (let i = 0; i < estimatedNumberServings; i++) {
        if (data[i].servingNumber > max) {
            max = data[i].servingNumber;
        }
    }

    return max;
}

function getBackColor(item) {
    const DONE = "#95ffa696";
    const WARNING = "#ffa095";

    const date = new Date(item.estimatedDateFeeding);
    let extendedDate = new Date(date);
    extendedDate.setMinutes(date.getMinutes() + 10);
    const currentDate = new Date();

    if (item.status) {
        return DONE;
    }
    if (!item.status && date.getDate() < currentDate.getDate()) {
        return WARNING;
    }
    if (!item.status && date.getDate() > currentDate.getDate()) {
        return "";
    }
    if (date.getHours() < currentDate.getHours()) {
        return WARNING;
    }
    if (date.getHours() === currentDate.getHours() &&
        extendedDate.getMinutes() < currentDate.getMinutes()) {
        return WARNING;
    }

    return "";
}

function generateTabList(handle) {
    return <TabListCalendar onChange={handle} />
};

class Main extends React.Component {
    constructor(props) {
        super(props);
        container.width = props.width;

        this.state = {
            url: props.url + "/diets",
            loading: true,
            value: new Date().getDate().toString(),
            disabledItem: false,
            formatData: [],
            tabList: <></>
        };
        this.handleChangeTab = this.handleChangeTab.bind(this);
        this.handleChangeCheckBox = this.handleChangeCheckBox.bind(this);
    }

    loadData() {
        const token = window.localStorage.getItem('token');

        var xhr = new XMLHttpRequest();
        xhr.open("GET", this.state.url, true);
        xhr.setRequestHeader("Authorization", "Bearer " + token);
        xhr.onload = function () {
            var result = JSON.parse(xhr.responseText);
            this.setState({ formatData: getFormatData(result.value), loading: false });
        }.bind(this);
        xhr.send();
    }

    componentDidMount() {
        if (this.props.auth) {
            this.setState({ tabList: generateTabList(this.handleChangeTab) });
            this.loadData();
        }
    }

    send(data) {
        const xhr = new XMLHttpRequest();
        const token = window.localStorage.getItem('token');
        xhr.open("PUT", this.state.url);
        xhr.setRequestHeader("content-type", "application/json");
        xhr.setRequestHeader("Authorization", "Bearer " + token);

        xhr.onload = () => {
            if (xhr.status === 200) {
                console.log(xhr.responseText);
            } else {
                console.log("Server response: ", xhr.statusText);
            }
        };

        var normalTypeDate = null;
        if (data.date != null) {
            //Добавляем часы в соответствии с часовым поясом. 
            //Причина: парсинг json отнимает часовой пояс.
            normalTypeDate = new Date(data.date);
            normalTypeDate.setUTCHours(normalTypeDate.getUTCHours() + 7);
        }

        var jsonData = JSON.stringify({
            id: data.id,
            servingNumber: data.servingNumber,
            waiterName: data.waiterName,
            date: normalTypeDate,
            status: Boolean(data.status),
        });

        xhr.send(jsonData);
    }

    handleChangeTab(event, newValue) {
        this.setState({
            value: newValue
        });
    };

    handleChangeCheckBox(event) {
        const DONE = "#95ffa696";
        //pach - это поле, генерируемое вот так name={index + ' ' + indexInList}  
        let pach = event.target.name.split(' ');
        let diet = this.state.formatData[pach[0]][pach[1]];
        let name = window.localStorage.getItem('name');
        if (event.target.checked) {
            diet = this.updateDietInFormatData(diet, pach, name, new Date(), event.target.checked, DONE);
            this.send(diet);
            return;
        }

        diet = this.updateDietInFormatData(diet, pach, null, null, null, "");
        this.send(diet);
    }

    updateDietInFormatData(diet, pach, name, date, checked, color) {
        diet.waiterName = name;
        diet.date = date;
        diet.status = checked;
        diet.backColor = color;

        //Рука лицо, ну а как по другому? только хуками, но пока этим заниматься не буду.
        let updateFormatData = this.state.formatData;
        updateFormatData[pach[0]][pach[1]] = diet;

        this.setState({ formatData: updateFormatData });

        return diet;
    }

    render() {

        return (
            !this.props.auth
                ? <Navigate to="/singin" />
                : <Container sx={container}>
                    <Typography sx={{ marginBottom: '20px', marginTop: '40px', textAlign: 'center' }} variant="h4">Покорми кота</Typography>
                    <TabContext value={this.state.value}>
                        <Box >
                            {this.state.tabList}
                        </Box>
                        <Typography sx={{ marginTop: '20px' }} variant="h6">Сегодня</Typography>
                        <TabPanelTodo loading={this.state.loading} data={this.state.formatData} value={this.state.value}
                            handleChangeCheckBox={this.handleChangeCheckBox} />
                    </TabContext>
                </Container >
        )
    }
}

export default Main;